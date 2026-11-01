/* Login e sincronização na nuvem (Supabase), sem bibliotecas.
   Local primeiro: o app grava no aparelho na hora e envia em segundo plano. */
import { state, replaceState, setSaveHook, hasData } from './store.js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const SKEY = 'flavia.session', MKEY = 'flavia.sync';
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignora */ } };

let session = read(SKEY, null);
let meta = read(MKEY, { remoteStamp: null, dirty: false, lastSync: null });
let status = session ? 'busy' : 'off';   // off | ok | busy | offline | error | conflict
let statusMsg = '';
let busy = false, pending = false, applying = false, snoozed = false, timer = null, localVersion = 0;
const subs = new Set();

export const onStatus = f => { subs.add(f); return () => subs.delete(f); };
export const getStatus = () => ({ status, msg: statusMsg, email: session?.user?.email || null, lastSync: meta.lastSync, loggedIn: !!session });
function setStatus(s, msg = '') { status = s; statusMsg = msg; subs.forEach(f => f()); }

class SyncError extends Error { constructor(msg, kind, code) { super(msg); this.kind = kind; this.code = code; } }

const FRIENDLY = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/user already registered|already been registered/i, 'Já existe uma conta com este e-mail. Toque em Entrar.'],
  [/password should be at least/i, 'A senha precisa ter pelo menos 6 caracteres.'],
  [/valid email|invalid email|unable to validate email/i, 'Digite um e-mail válido.'],
  [/email not confirmed/i, 'Confirme o e-mail antes de entrar (veja sua caixa de entrada).'],
  [/rate limit|too many/i, 'Muitas tentativas. Espere um minuto e tente de novo.'],
  [/signups? (are )?disabled/i, 'Novos cadastros estão desativados neste projeto.'],
];
export const friendly = e => (FRIENDLY.find(([rx]) => rx.test(e.message)) || [0, e.message || 'Algo deu errado.'])[1];

/* ---------- HTTP ---------- */
async function raw(path, { method = 'GET', body, headers = {}, token, keepalive = false } = {}) {
  const h = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...headers };
  if (token) h.Authorization = 'Bearer ' + token;
  let res;
  try { res = await fetch(SUPABASE_URL + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined, keepalive }); }
  catch { throw new SyncError('Sem conexão com a internet.', 'network'); }
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* ignora */ }
  if (!res.ok) throw new SyncError(json?.msg || json?.error_description || json?.message || json?.error || `Erro ${res.status}`, 'http', res.status);
  return json;
}

async function refresh() {
  if (!session?.refresh_token) return false;
  try {
    const r = await raw('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } });
    setSession(r); return true;
  } catch (e) {
    if (e.kind === 'http') { dropSession(); setStatus('error', 'Sessão expirada. Entre de novo.'); }
    throw e;
  }
}
async function api(path, opts = {}) {
  if (!session) throw new SyncError('Faça login para sincronizar.', 'auth');
  if (session.expires_at - 60 < Date.now() / 1000) await refresh();
  try { return await raw(path, { ...opts, token: session.access_token }); }
  catch (e) {
    if (e.code === 401 && await refresh()) return raw(path, { ...opts, token: session.access_token });
    throw e;
  }
}

/* ---------- Conta ---------- */
function setSession(r) {
  session = { access_token: r.access_token, refresh_token: r.refresh_token,
    expires_at: r.expires_at || Math.floor(Date.now() / 1000) + (r.expires_in || 3600), user: { id: r.user.id, email: r.user.email } };
  write(SKEY, session);
}
function dropSession() { session = null; try { localStorage.removeItem(SKEY); } catch { /* ignora */ } }
function resetMeta() { meta = { remoteStamp: null, dirty: false, lastSync: null }; write(MKEY, meta); }

export async function signIn(email, password) {
  const r = await raw('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
  if (session && session.user.id !== r.user.id) resetMeta();
  setSession(r); snoozed = false; await sync();
}
/** Retorna 'ok' (já entrou) ou 'confirm' (precisa confirmar o e-mail). */
export async function signUp(email, password) {
  const r = await raw('/auth/v1/signup', { method: 'POST', body: { email, password } });
  if (!r?.access_token) return 'confirm';
  resetMeta(); setSession(r); snoozed = false; await sync(); return 'ok';
}
export function signOut() {
  clearTimeout(timer); dropSession(); resetMeta(); setStatus('off');
}

/* ---------- Sincronização ---------- */
const snapshot = () => JSON.parse(JSON.stringify(state));
export const summarize = d => `${d.goals?.length || 0} metas · ${d.tasks?.length || 0} tarefas · ${d.notes?.length || 0} notas · ${Object.keys(d.moods || {}).length} humores`;

let conflictUI = async () => 'later';
export const setConflictHandler = f => { conflictUI = f; };

async function push(keepalive = false) {
  const v = localVersion;
  const rows = await api('/rest/v1/user_data?on_conflict=user_id', { method: 'POST', keepalive,
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: { user_id: session.user.id, data: snapshot(), updated_at: new Date().toISOString() } });
  meta.remoteStamp = rows[0].updated_at;
  if (v === localVersion) meta.dirty = false; else pending = true;
  write(MKEY, meta);
}
async function pull(row) {
  row = row || (await api(`/rest/v1/user_data?user_id=eq.${session.user.id}&select=data,updated_at`))[0];
  applying = true;
  try { replaceState(row.data); } finally { applying = false; }
  meta.remoteStamp = row.updated_at; meta.dirty = false; write(MKEY, meta);
}
async function resolveConflict() {
  if (snoozed) { setStatus('conflict', 'Dados diferentes na nuvem. Toque em Sincronizar agora.'); return false; }
  setStatus('conflict', 'Escolha quais dados manter.');
  const row = (await api(`/rest/v1/user_data?user_id=eq.${session.user.id}&select=data,updated_at`))[0];
  const choice = await conflictUI({ local: summarize(state), cloud: summarize(row.data) });
  if (choice === 'cloud') { await pull(row); return true; }
  if (choice === 'local') { await push(); return true; }
  snoozed = true; setStatus('conflict', 'Dados diferentes na nuvem. Toque em Sincronizar agora.'); return false;
}

export async function sync({ manual = false } = {}) {
  if (!session) return;
  if (manual) snoozed = false;
  if (busy) { pending = true; return; }
  busy = true; setStatus('busy');
  let ok = true;
  try {
    const rows = await api(`/rest/v1/user_data?user_id=eq.${session.user.id}&select=updated_at`);
    const remote = rows[0];
    if (!remote) await push();
    else if (remote.updated_at === meta.remoteStamp) { if (meta.dirty) await push(); }
    else if (!meta.dirty && (meta.remoteStamp || !hasData())) await pull();
    else ok = await resolveConflict();
    if (ok) { meta.lastSync = new Date().toISOString(); write(MKEY, meta); setStatus('ok'); }
  } catch (e) {
    if (e.kind === 'network') setStatus('offline', 'Sem conexão. Vou enviar quando voltar.');
    else if (session) setStatus('error', friendly(e));
  } finally {
    busy = false;
    if (pending) { pending = false; schedule(300); }
  }
}
function schedule(ms = 1500) { clearTimeout(timer); timer = setTimeout(() => sync(), ms); }

export function init() {
  setSaveHook(() => {
    if (applying) return;
    localVersion++; meta.dirty = true; write(MKEY, meta);
    if (session) { if (!busy) setStatus('busy'); busy ? (pending = true) : schedule(); }
  });
  const flush = () => { if (session && meta.dirty && !busy) push(true).catch(() => {}); };
  addEventListener('online', () => session && sync());
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') session && sync(); else flush();
  });
  setInterval(() => { if (session && document.visibilityState === 'visible') sync(); }, 60000);
  if (session) sync(); else setStatus('off');
}
