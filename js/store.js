const KEY = 'flavia.v1';
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const defaults = () => ({
  areas: [
    { id: 'saude', name: 'Saúde', emoji: '💚', color: 'var(--sys-green)' },
    { id: 'carreira', name: 'Carreira', emoji: '💼', color: 'var(--sys-blue)' },
    { id: 'financas', name: 'Finanças', emoji: '💰', color: 'var(--sys-yellow)' },
    { id: 'relacionamentos', name: 'Relacionamentos', emoji: '💞', color: 'var(--sys-pink)' },
    { id: 'familia', name: 'Família', emoji: '🏡', color: 'var(--sys-orange)' },
    { id: 'mente', name: 'Mente & Espírito', emoji: '🧘', color: 'var(--sys-purple)' },
    { id: 'lazer', name: 'Lazer', emoji: '🎨', color: 'var(--sys-teal)' },
    { id: 'crescimento', name: 'Crescimento', emoji: '🌱', color: 'var(--sys-mint)' },
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
