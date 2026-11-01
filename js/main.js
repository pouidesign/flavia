import { h, svg, openModal, toast, ask } from './ui.js';
import { icon } from './icons.js';
import * as cloud from './sync.js';
import { state, onChange, replaceState, resetState } from './store.js';
import { renderAgenda } from './agenda.js';
import { renderPlan } from './plan.js';
import { renderAreas } from './areas.js';
import { renderNotes } from './notes.js';
import { renderMood } from './mood.js';

const TABS = [
  ['agenda', 'agenda', 'Agenda', renderAgenda], ['plan', 'plan', 'Planejar', renderPlan], ['areas', 'areas', 'Áreas', renderAreas],
  ['notes', 'notes', 'Notas', renderNotes], ['mood', 'mood', 'Humor', renderMood],
];
/* Ícones de traço no estilo SF Symbols (grade 24) */
const ICONS = {
  agenda: () => [svg('rect', { class: 'fl', x: 3.5, y: 5, width: 17, height: 15.5, rx: 3.5 }), svg('path', { d: 'M3.5 10h17M8 3v4M16 3v4' })],
  plan: () => [svg('circle', { cx: 12, cy: 12, r: 8.5 }), svg('circle', { cx: 12, cy: 12, r: 4.5, class: 'fl' }), svg('circle', { cx: 12, cy: 12, r: .8 })],
  areas: () => [svg('circle', { cx: 12, cy: 12, r: 8.5 }), svg('path', { class: 'fl', d: 'M15.8 8.2l-2 5.6-5.6 2 2-5.6z' })],
  notes: () => [svg('path', { d: 'M11 4H7.5A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5V13' }), svg('path', { class: 'fl', d: 'M18.2 3.6l2.2 2.2-8.2 8.2-3 .8.8-3z' })],
  mood: () => [svg('path', { class: 'fl', d: 'M20 14.2A8.3 8.3 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2z' })],
};
const tabIcon = k => svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, ICONS[k]());

/* Tamanho do texto (Dynamic Type manual) */
const SIZES = [['.9', 'Pequeno'], ['1', 'Padrão'], ['1.15', 'Grande'], ['1.3', 'Maior']];
const getDt = () => { try { return localStorage.getItem('flavia.dt') || '1'; } catch { return '1'; } };
const setDt = v => { document.documentElement.style.setProperty('--dt', v); try { localStorage.setItem('flavia.dt', v); } catch { /* ignora */ } };
setDt(getDt());
let tab = (() => { try { return sessionStorage.getItem('tab'); } catch { return null; } })() || 'agenda';
if (!TABS.some(t => t[0] === tab)) tab = 'agenda';

const main = h('main', { class: 'view', id: 'view' });
const bar = h('nav', { class: 'tabbar', 'aria-label': 'Seções' });

function draw() {
  bar.replaceChildren(...TABS.map(([k, ico, label]) => h('button', { class: 'tab' + (k === tab ? ' on' : ''), 'aria-current': k === tab ? 'page' : null,
    onclick: () => { tab = k; try { sessionStorage.setItem('tab', k); } catch { /* ignora */ } draw(); } }, tabIcon(ico), h('span', {}, label))));
  const scrollY = main.dataset.tab === tab ? window.scrollY : 0;
  main.dataset.tab = tab;
  TABS.find(t => t[0] === tab)[3](main);
  window.scrollTo(0, scrollY);
}
onChange(draw);
document.addEventListener('flavia:save-failed', () => toast('Não foi possível salvar: armazenamento cheio. Exporte um backup e libere espaço.'));

function exportBackup() {
  const json = JSON.stringify(state, null, 2);
  const ta = h('textarea', { rows: 8, readOnly: true, value: json, 'aria-label': 'Backup em JSON', onfocus: e => e.target.select() });
  openModal('Backup', h('div', { class: 'form' },
    h('p', { class: 'hint' }, 'Copie o texto e guarde em um lugar seguro, ou baixe o arquivo.'), ta,
    h('div', { class: 'form-foot' },
      h('button', { type: 'button', class: 'btn', onclick: async () => { try { await navigator.clipboard.writeText(json); toast('Copiado.'); } catch { ta.select(); toast('Selecione e copie o texto.'); } } }, 'Copiar'),
      h('button', { type: 'button', class: 'btn primary', onclick: () => {
        const a = h('a', { href: URL.createObjectURL(new Blob([json], { type: 'application/json' })), download: `minha-vida-${new Date().toISOString().slice(0, 10)}.json` });
        a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      } }, 'Baixar arquivo'))));
}

/* ---------- Conta e sincronização ---------- */
const ago = iso => { if (!iso) return 'ainda não sincronizou'; const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
  return s < 45 ? 'agora há pouco' : s < 3600 ? `há ${Math.round(s / 60)} min` : s < 86400 ? `há ${Math.round(s / 3600)} h` : new Date(iso).toLocaleDateString('pt-BR'); };
const STATUS_TXT = { ok: 'Tudo salvo na nuvem', busy: 'Sincronizando…', offline: 'Sem conexão', error: 'Atenção', conflict: 'Dados diferentes', off: 'Sem login' };

function openAccount() {
  const info = cloud.getStatus();
  if (info.loggedIn) {
    const line = h('p', {}), msg = h('p', { class: 'muted small' });
    const paint = () => { const s = cloud.getStatus(); line.textContent = `${STATUS_TXT[s.status]} · ${ago(s.lastSync)}`; msg.textContent = s.msg; };
    paint(); const off = cloud.onStatus(paint);
    const close = openModal('Conta', h('div', { class: 'form' },
      h('p', { class: 'muted small' }, 'Conectada como'), h('p', { class: 'acc-email' }, info.email), line, msg,
      h('p', { class: 'hint' }, 'Seu progresso é salvo neste aparelho na hora e enviado para a nuvem em seguida. Em outro aparelho, entre com o mesmo e-mail.'),
      h('div', { class: 'form-foot' },
        h('button', { type: 'button', class: 'btn danger', onclick: async () => { if (await ask('Sair desta conta? Os dados continuam neste aparelho e na nuvem.', 'Sair')) { off(); close(); cloud.signOut(); } } }, 'Sair'),
        h('span', { class: 'grow' }),
        h('button', { type: 'button', class: 'btn primary', onclick: () => cloud.sync({ manual: true }) }, 'Sincronizar agora'))));
    return;
  }
  const email = h('input', { id: 'acc-email', type: 'email', autocomplete: 'email', placeholder: 'voce@email.com', inputMode: 'email', autocapitalize: 'off' });
  const pass = h('input', { id: 'acc-pass', type: 'password', autocomplete: 'current-password', placeholder: 'Mínimo 6 caracteres' });
  const err = h('p', { class: 'err' }), ok = h('p', { class: 'hint' });
  ok.hidden = true;
  const run = async fn => {
    err.textContent = ''; ok.hidden = true;
    if (!email.value.trim() || !pass.value) { err.textContent = 'Preencha e-mail e senha.'; return; }
    btns.forEach(b => b.disabled = true);
    try { const r = await fn(email.value.trim(), pass.value);
      if (r === 'confirm') { ok.hidden = false; ok.textContent = 'Conta criada. Confirme o e-mail que enviamos e depois toque em Entrar.'; }
      else close();
    } catch (e) { err.textContent = cloud.friendly(e); } finally { btns.forEach(b => b.disabled = false); }
  };
  const enter = h('button', { type: 'submit', class: 'btn primary' }, 'Entrar');
  const create = h('button', { type: 'button', class: 'btn', onclick: () => run(cloud.signUp) }, 'Criar conta');
  const btns = [enter, create];
  const form = h('form', { class: 'form', novalidate: true, onsubmit: e => { e.preventDefault(); run(cloud.signIn); } },
    h('p', { class: 'hint' }, 'Entre para salvar seu progresso na nuvem e usar em mais de um aparelho. Os dados deste aparelho continuam aqui.'),
    h('label', { class: 'field' }, h('span', { class: 'lbl' }, 'E-mail'), email),
    h('label', { class: 'field' }, h('span', { class: 'lbl' }, 'Senha'), pass), err, ok,
    h('div', { class: 'form-foot' }, create, h('span', { class: 'grow' }), enter));
  const close = openModal('Entrar na nuvem', form);
}

cloud.setConflictHandler(({ local, cloud: remote }) => new Promise(resolve => {
  let done = false, close = () => {};
  const finish = v => { if (done) return; done = true; close(); resolve(v); };
  close = openModal('Dados diferentes', h('div', { class: 'form' },
    h('p', {}, 'Este aparelho e a nuvem têm dados diferentes. Qual manter? O outro será substituído.'),
    h('div', { class: 'card conflict' }, h('b', {}, 'Neste aparelho'), h('p', { class: 'muted small' }, local)),
    h('div', { class: 'card conflict' }, h('b', {}, 'Na nuvem'), h('p', { class: 'muted small' }, remote)),
    h('div', { class: 'form-foot' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => finish('later') }, 'Decidir depois'),
      h('span', { class: 'grow' }),
      h('button', { type: 'button', class: 'btn', onclick: () => finish('local') }, 'Manter este aparelho'),
      h('button', { type: 'button', class: 'btn primary', onclick: () => finish('cloud') }, 'Manter a nuvem'))));
}));

function settings() {
  const file = h('input', { type: 'file', accept: 'application/json', hidden: true, onchange: async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data.areas || !data.goals) throw new Error('formato');
      if (await ask('Importar vai substituir TODOS os dados atuais. Continuar?', 'Substituir')) { replaceState(data); toast('Backup importado.'); }
    } catch { toast('Arquivo inválido.'); }
  } });
  openModal('Dados e backup', h('div', { class: 'menu' },
    h('div', {}, h('p', { class: 'muted small', style: { marginBottom: '8px' } }, 'Tamanho do texto'),
      h('div', { class: 'seg', id: 'dt-seg' }, SIZES.map(([v, l]) => h('button', { class: v === getDt() ? 'on' : '', onclick: e => { setDt(v); e.target.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === e.target)); } }, l)))),
    h('p', { class: 'muted small' }, 'Seus dados ficam somente neste dispositivo (navegador). Faça backups de vez em quando.'),
    h('button', { class: 'btn', onclick: exportBackup }, [icon('download'), ' Exportar backup']),
    h('button', { class: 'btn', onclick: () => file.click() }, [icon('upload'), ' Importar backup']),
    h('button', { class: 'btn danger', onclick: async () => { if (await ask('Apagar TUDO? Isso não pode ser desfeito.', 'Apagar') && await ask('Tem certeza absoluta?', 'Apagar tudo')) { resetState(); toast('Tudo apagado.'); } } }, [icon('trash'), ' Apagar tudo']),
    file));
}

document.getElementById('app').append(
  h('header', { class: 'topbar' }, h('h1', {}, 'Minha Vida'), h('div', { class: 'top-actions' }, h('button', { class: 'icon-btn cloud-btn', id: 'cloud-btn', 'aria-label': 'Conta e sincronização', onclick: openAccount }, icon('cloud', 24)), h('button', { class: 'icon-btn', 'aria-label': 'Dados e backup', onclick: settings }, icon('gear', 24)))),
  main, bar);
draw();
const paintCloud = () => { const b = document.getElementById('cloud-btn'); if (b) { const s = cloud.getStatus(); b.dataset.s = s.status; b.title = STATUS_TXT[s.status]; } };
cloud.onStatus(paintCloud); cloud.init(); paintCloud();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
