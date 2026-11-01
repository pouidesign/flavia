const KEY = 'flavia.v1';
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const defaults = () => ({
  areas: [
    { id: 'saude', name: 'Saúde', icon: 'heart', color: 'var(--sys-green)' },
    { id: 'carreira', name: 'Carreira', icon: 'briefcase', color: 'var(--sys-blue)' },
    { id: 'financas', name: 'Finanças', icon: 'coins', color: 'var(--sys-yellow)' },
    { id: 'relacionamentos', name: 'Relacionamentos', icon: 'people', color: 'var(--sys-pink)' },
    { id: 'familia', name: 'Família', icon: 'home', color: 'var(--sys-orange)' },
    { id: 'mente', name: 'Mente & Espírito', icon: 'sparkle', color: 'var(--sys-purple)' },
    { id: 'lazer', name: 'Lazer', icon: 'palette', color: 'var(--sys-teal)' },
    { id: 'crescimento', name: 'Crescimento', icon: 'sprout', color: 'var(--sys-mint)' },
  ],
  goals: [], tasks: [], events: [], habits: [], routines: [],
  notes: [], journal: {}, boards: [], moods: {},
});

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === 'object') return { ...defaults(), ...s };
  } catch { /* ignora */ }
  return defaults();
}

export const state = load();
const listeners = [];
let saveHook = null;
/** Chamado a cada gravação (a sincronização usa isto). */
export function setSaveHook(f) { saveHook = f; }
/** Há algum dado do usuário (além do padrão)? */
export function hasData() {
  return ['goals', 'tasks', 'events', 'habits', 'routines', 'notes', 'boards'].some(k => state[k]?.length)
    || Object.keys(state.moods || {}).length > 0 || Object.keys(state.journal || {}).length > 0;
}

/** Grava sem redesenhar (digitação, arrastar). */
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { document.dispatchEvent(new CustomEvent('flavia:save-failed')); }
  saveHook?.();
}
/** Grava e redesenha a aba atual. */
export function commit() { save(); listeners.forEach(f => f()); }
export function onChange(f) { listeners.push(f); }
export function replaceState(next) {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, defaults(), next);
  commit();
}
export function resetState() { replaceState(defaults()); }
