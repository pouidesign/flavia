const KEY = 'flavia.v1';
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const defaults = () => ({
  areas: [
    { id: 'saude', name: 'Saúde', emoji: '💚', color: '#4fb7a5' },
    { id: 'carreira', name: 'Carreira', emoji: '💼', color: '#6b8cef' },
    { id: 'financas', name: 'Finanças', emoji: '💰', color: '#e9b44c' },
    { id: 'relacionamentos', name: 'Relacionamentos', emoji: '💞', color: '#e5707e' },
    { id: 'familia', name: 'Família', emoji: '🏡', color: '#f0a26b' },
    { id: 'mente', name: 'Mente & Espírito', emoji: '🧘', color: '#a07be0' },
    { id: 'lazer', name: 'Lazer', emoji: '🎨', color: '#5bbcd6' },
    { id: 'crescimento', name: 'Crescimento', emoji: '🌱', color: '#8fcf8f' },
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

/** Grava sem redesenhar (digitação, arrastar). */
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { alert('Não foi possível salvar: armazenamento do navegador cheio. Exporte um backup e libere espaço (ex.: imagens do canvas).'); }
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
