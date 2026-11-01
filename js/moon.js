import { parse } from './dates.js';
const SYN = 29.530588853;
const REF = Date.UTC(2000, 0, 6, 18, 14);

/** Fase 0..1 (0 = nova, 0.5 = cheia). */
export function moonPhase(s) {
  const d = parse(s);
  const t = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  let age = ((t - REF) / 864e5) % SYN;
  if (age < 0) age += SYN;
  return age / SYN;
}
export const PHASES = [
  { n: 'Lua nova' }, { n: 'Crescente' }, { n: 'Quarto crescente' }, { n: 'Crescente gibosa' },
  { n: 'Lua cheia' }, { n: 'Minguante gibosa' }, { n: 'Quarto minguante' }, { n: 'Minguante' },
];
export const phaseIndex = p => Math.floor(p * 8 + 0.5) % 8;

/** Caminho SVG da parte iluminada (centro 0,0). `flip` espelha para a lua minguante. */
export function moonShape(r, p) {
  const flip = p > 0.5, q = flip ? 1 - p : p;
  const c = Math.cos(2 * Math.PI * q);
  const rx = Math.abs(c) * r;
  const sweep = c > 0 ? 0 : 1;
  return { d: `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${rx} ${r} 0 0 ${sweep} 0 ${-r}Z`, flip };
}
