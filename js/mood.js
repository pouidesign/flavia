import { h, svg } from './ui.js';
import { state, commit, save } from './store.js';
import { today, parse, iso, addMonths, startOfMonth, daysInMonth, fmtMonth, fmtLong } from './dates.js';
import { moonPhase, moonShape, phaseIndex, PHASES } from './moon.js';

export const MOODS = [
  { l: 1, e: '😞', n: 'Muito mal', c: 'var(--mood-1)' }, { l: 2, e: '😕', n: 'Mal', c: 'var(--mood-2)' }, { l: 3, e: '😐', n: 'Neutro', c: 'var(--mood-3)' },
  { l: 4, e: '🙂', n: 'Bem', c: 'var(--mood-4)' }, { l: 5, e: '😄', n: 'Muito bem', c: 'var(--mood-5)' },
];
const FACTORS = ['Sono', 'Exercício', 'Social', 'Trabalho', 'Alimentação', 'Família', 'Dinheiro', 'Saúde'];
let month = startOfMonth(today()), selected = today(), host;

export function renderMood(root) { host = root; draw(); }

const polar = (r, deg) => [r * Math.cos(deg * Math.PI / 180), r * Math.sin(deg * Math.PI / 180)];
function sector(r0, r1, a0, a1) {
  const [x0, y0] = polar(r1, a0), [x1, y1] = polar(r1, a1), [x2, y2] = polar(r0, a1), [x3, y3] = polar(r0, a0);
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0}A${r1} ${r1} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${big} 0 ${x3} ${y3}Z`;
}
export function moonGlyph(r, p, x = 0, y = 0, cls = '') {
  const { d, flip } = moonShape(r, p);
  return svg('g', { transform: `translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`, class: 'moon ' + cls },
    svg('circle', { r, class: 'moon-dark' }), svg('path', { d, class: 'moon-lit' }));
}

function mandala() {
  const p0 = parse(month), N = daysInMonth(p0.getFullYear(), p0.getMonth()), step = 360 / N;
  const R0 = 112, R1 = 192, RM = 226;
  const parts = [];
  parts.push(svg('circle', { r: R0 - 8, class: 'm-line' }), svg('circle', { r: R1 + 8, class: 'm-line' }));
  for (let i = 0; i < N; i++) {
    const d = iso(new Date(p0.getFullYear(), p0.getMonth(), i + 1)), a0 = -90 + i * step, a1 = a0 + step - 1.2, mid = (a0 + a1) / 2;
    const m = state.moods[d], mood = m && MOODS.find(x => x.l === m.level);
    const [tx, ty] = polar(R0 + 13, mid), [mx, my] = polar(RM, mid), ph = moonPhase(d);
    parts.push(svg('g', { class: 'm-day' + (d === selected ? ' sel' : '') + (d === today() ? ' now' : ''), tabindex: 0, role: 'button', 'aria-label': `${fmtLong(d)} · ${mood ? mood.n : 'sem registro'} · ${PHASES[phaseIndex(ph)].n}`,
      onclick: () => { selected = d; draw(); }, onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { selected = d; draw(); } } },
      svg('path', { d: sector(R0, R1, a0, a1), fill: mood ? mood.c : 'var(--fill)', class: 'm-sec' }),
      svg('text', { x: tx, y: ty + 3, 'text-anchor': 'middle', class: 'm-num' }, i + 1),
      moonGlyph(phaseIndex(ph) === 4 ? 11 : 9, ph, mx, my, phaseIndex(ph) === 4 ? 'full' : '')));
  }
  const ph = moonPhase(selected), pi = phaseIndex(ph);
  parts.push(moonGlyph(50, ph, 0, -6, 'center'),
    svg('text', { x: 0, y: 60, 'text-anchor': 'middle', class: 'm-phase' }, PHASES[pi].n),
    svg('text', { x: 0, y: 78, 'text-anchor': 'middle', class: 'm-date' }, parse(selected).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })));
  return svg('svg', { viewBox: '-250 -250 500 500', class: 'mandala', role: 'group', 'aria-label': 'Mandala lunar do mês' }, parts);
}

function stats() {
  const p0 = parse(month), N = daysInMonth(p0.getFullYear(), p0.getMonth());
  const rec = [];
  for (let i = 1; i <= N; i++) { const d = iso(new Date(p0.getFullYear(), p0.getMonth(), i)); if (state.moods[d]) rec.push([d, state.moods[d].level]); }
  const avg = rec.length ? rec.reduce((s, [, l]) => s + l, 0) / rec.length : 0;
  const best = rec.length ? rec.reduce((a, b) => b[1] > a[1] ? b : a) : null;
  // humor médio por fase da lua (todo o histórico)
  const byPhase = PHASES.map(() => ({ s: 0, n: 0 }));
  Object.entries(state.moods).forEach(([d, m]) => { const i = phaseIndex(moonPhase(d)); byPhase[i].s += m.level; byPhase[i].n++; });
  return h('div', { class: 'mood-stats' },
    h('div', { class: 'card' }, h('h3', {}, 'No mês'),
      rec.length ? h('div', {}, h('p', {}, `${rec.length} dia(s) registrado(s) · humor médio `, h('b', {}, avg.toFixed(1).replace('.', ',') + ' ' + MOODS[Math.round(avg) - 1].e)),
        best && h('p', { class: 'muted small' }, `Melhor dia: ${fmtLong(best[0])}`)) : h('p', { class: 'muted' }, 'Sem registros neste mês.'),
      h('div', { class: 'legend' }, MOODS.map(m => h('span', {}, h('i', { style: { background: m.c } }), m.n)))),
    h('div', { class: 'card' }, h('h3', {}, 'Humor por fase da lua'),
      h('div', { class: 'phase-bars' }, PHASES.map((p, i) => {
        const b = byPhase[i], v = b.n ? b.s / b.n : 0;
        return h('div', { class: 'pb', title: b.n ? `${v.toFixed(1)} em ${b.n} dia(s)` : 'sem dados' },
          h('div', { class: 'pb-bar' }, h('i', { style: { height: (v / 5 * 100) + '%', background: b.n ? MOODS[Math.max(0, Math.round(v) - 1)].c : 'transparent' } })),
          h('span', {}, p.e));
      })),
      h('p', { class: 'muted small' }, 'Média de humor em cada fase, considerando todos os seus registros.')));
}

function entry() {
  const m = state.moods[selected] || {};
  const ph = PHASES[phaseIndex(moonPhase(selected))];
  const set = patch => { state.moods[selected] = { level: null, factors: [], note: '', ...m, ...patch }; };
  return h('section', { class: 'card mood-entry' },
    h('h3', {}, selected === today() ? 'Como você está hoje?' : `Como foi ${fmtLong(selected)}?`),
    h('p', { class: 'muted small' }, `${ph.e} ${ph.n}`),
    h('div', { class: 'moods' }, MOODS.map(x => h('button', { class: 'mood-btn' + (m.level === x.l ? ' on' : ''), style: { '--c': x.c }, 'aria-pressed': String(m.level === x.l),
      onclick: () => { if (m.level === x.l) { delete state.moods[selected]; } else set({ level: x.l }); commit(); } }, h('span', {}, x.e), h('small', {}, x.n)))),
    m.level && h('div', { class: 'factors' }, FACTORS.map(f => h('button', { class: 'tag' + (m.factors?.includes(f) ? ' on' : ''),
      onclick: () => { const fs = new Set(m.factors || []); fs.has(f) ? fs.delete(f) : fs.add(f); set({ factors: [...fs] }); commit(); } }, f))),
    m.level && h('textarea', { rows: 2, placeholder: 'Quer anotar algo sobre o dia?', value: m.note || '', oninput: e => { set({ note: e.target.value }); save(); } }));
}

function draw() {
  host.replaceChildren(h('div', { class: 'mood-view' },
    h('div', { class: 'mood-nav' },
      h('button', { class: 'icon-btn', 'aria-label': 'Mês anterior', onclick: () => { month = addMonths(month, -1); selected = month; draw(); } }, '‹'),
      h('h2', {}, fmtMonth(month)),
      h('button', { class: 'icon-btn', 'aria-label': 'Próximo mês', onclick: () => { month = addMonths(month, 1); selected = month; draw(); } }, '›'),
      h('button', { class: 'btn ghost sm', onclick: () => { month = startOfMonth(today()); selected = today(); draw(); } }, 'Hoje')),
    h('div', { class: 'mood-main' }, h('div', { class: 'mandala-wrap' }, mandala()), h('div', {}, entry(), stats()))));
}
