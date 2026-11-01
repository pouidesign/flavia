import { h, sheet } from './ui.js';
import { icon, routineIcon } from './icons.js';
import { state, commit } from './store.js';
import { today, addDays, addMonths, startOfWeek, startOfMonth, parse, iso, fmtLong, fmtMonth, fmtShort, daysInMonth, WD_SHORT } from './dates.js';
import { dayItems, ageOn, habitDue, streak } from './data.js';
import { check, chip, goalChip, areaChip, taskRow, segmented, section, empty } from './components.js';
import { taskForm, eventForm } from './forms.js';

let view = 'day', cursor = today(), host;
const ICON = { compromisso: 'pin', aniversario: 'cake', data: 'star' };

export function renderAgenda(root) { host = root; draw(); }

function go(n) {
  dir = n;
  cursor = view === 'day' ? addDays(cursor, n) : view === 'week' ? addDays(cursor, 7 * n) : addMonths(cursor, n);
  draw();
}
document.addEventListener('keydown', e => {
  if (!document.querySelector('.view-agenda') || document.querySelector('.overlay')) return;
  if (e.target.matches('input,textarea,select,[contenteditable=true]')) return;
  if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1);
});

function title() {
  if (view === 'day') return fmtLong(cursor) + (cursor === today() ? ' · hoje' : '');
  if (view === 'week') { const s = startOfWeek(cursor); return `${fmtShort(s)} – ${fmtShort(addDays(s, 6))} · ${parse(s).getFullYear()}`; }
  return fmtMonth(cursor);
}

let dir = 0;   // sentido da última navegação (anima a entrada)
const UNIT = { day: 'dia', week: 'semana', month: 'mês' };

function draw() {
  const body = h('div', { class: 'lateral-body' + (dir ? (dir > 0 ? ' in-next' : ' in-prev') : '') },
    h('h2', { class: 'period' }, title()),
    h('p', { class: 'swipe-hint' }, `Deslize para os lados para mudar de ${UNIT[view]}`),
    view === 'day' ? dayBody() : view === 'week' ? weekBody() : monthBody());
  dir = 0;
  const lateral = h('div', { class: 'lateral', onpointerdown: swipeStart }, body);
  host.replaceChildren(h('div', { class: 'view-agenda' },
    h('div', { class: 'toolbar' },
      segmented([['day', 'Dia'], ['week', 'Semana'], ['month', 'Mês']], view, k => { view = k; draw(); }),
      h('button', { class: 'btn ghost', onclick: () => { cursor = today(); draw(); } }, 'Hoje')),
    lateral,
    h('button', { class: 'fab', 'aria-label': 'Adicionar', onclick: addMenu }, '+')));
}

/* Arrastar (dedo ou mouse) para os lados troca de dia/semana/mês */
const sw = { id: null, x: 0, y: 0, moved: false };
function swipeStart(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (e.target.closest('input,textarea,select')) return;
  Object.assign(sw, { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false });
}
window.addEventListener('pointermove', e => { if (e.pointerId === sw.id && Math.abs(e.clientX - sw.x) > 12) sw.moved = true; });
window.addEventListener('pointerup', e => {
  if (e.pointerId !== sw.id) return;
  sw.id = null;
  const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
});
window.addEventListener('pointercancel', () => { sw.id = null; });
// depois de arrastar, não deixa o "clique" abrir o item que estava embaixo
window.addEventListener('click', e => { if (sw.moved && e.target.closest?.('.lateral')) { e.stopPropagation(); e.preventDefault(); } sw.moved = false; }, true);

function addMenu() {
  sheet('Adicionar em ' + fmtShort(cursor), [
    { label: [icon('check'), ' Tarefa'], fn: () => taskForm(null, { date: cursor }) },
    { label: [icon('pin'), ' Compromisso'], fn: () => eventForm(null, { date: cursor, type: 'compromisso' }) },
    { label: [icon('cake'), ' Aniversário'], fn: () => eventForm(null, { date: cursor, type: 'aniversario' }) },
    { label: [icon('star'), ' Data especial'], fn: () => eventForm(null, { date: cursor, type: 'data' }) },
  ]);
}

const eventLabel = (e, d) => e.type === 'aniversario' && ageOn(e, d) > 0 ? `${e.title} · faz ${ageOn(e, d)} anos` : e.title;

function eventRow(e, d) {
  return h('div', { class: 'row ev', onclick: () => eventForm(e) },
    h('span', { class: 'ev-ico' }, icon(ICON[e.type] || 'pin', 22)),
    h('div', { class: 'row-main' }, h('div', { class: 'row-title' }, eventLabel(e, d)),
      h('div', { class: 'row-meta' }, e.time && h('span', { class: 'time' }, e.time), e.note && h('span', { class: 'muted small' }, e.note))));
}

function dayBody(d = cursor) {
  const it = dayItems(d);
  const overdue = d === today() ? state.tasks.filter(t => !t.done && t.date && t.date < d) : [];
  const out = [];
  if (it.events.length) out.push(section('Compromissos e datas', it.events.map(e => eventRow(e, d))));
  if (overdue.length) out.push(section([icon('warning'), ' Atrasadas'], overdue.map(t => taskRow(t, { date: true }))));
  out.push(section('Tarefas', it.tasks.length ? it.tasks.map(t => taskRow(t)) : [empty('Nenhuma tarefa neste dia.')]));
  if (it.habits.length) out.push(section('Hábitos', it.habits.map(x => h('div', { class: 'row' + (x.log[d] ? ' done' : '') },
    check(x.log[d], () => { x.log[d] ? delete x.log[d] : (x.log[d] = true); commit(); }),
    h('div', { class: 'row-main' }, h('div', { class: 'row-title' }, x.title),
      h('div', { class: 'row-meta' }, streak(x) > 0 && h('span', { class: 'time' }, [icon('flame'), ` ${streak(x)}`]), x.goalId && goalChip(x.goalId)))))));
  for (const r of it.routines) {
    const log = r.log[d] || {};
    const items = [...r.items].sort((a, b) => (a.time || '99') < (b.time || '99') ? -1 : 1);
    const n = items.filter(i => log[i.id]).length;
    out.push(section([icon(routineIcon(r)), ` ${r.name}  ·  ${n}/${items.length}`], items.length ? items.map(i => h('div', { class: 'row' + (log[i.id] ? ' done' : '') },
      check(log[i.id], () => { r.log[d] = r.log[d] || {}; r.log[d][i.id] ? delete r.log[d][i.id] : (r.log[d][i.id] = true); commit(); }),
      h('div', { class: 'row-main' }, h('div', { class: 'row-title' }, i.title),
        h('div', { class: 'row-meta' }, i.time && h('span', { class: 'time' }, i.time), i.goalId && goalChip(i.goalId))))) : [empty('Rotina sem itens.')]));
  }
  return h('div', { class: 'day-view' }, out);
}

function miniItems(d) {
  const it = dayItems(d);
  const lines = [
    ...it.events.map(e => h('div', { class: 'mini ev', onclick: ev => { ev.stopPropagation(); eventForm(e); } }, [icon(ICON[e.type] || 'pin'), ` ${e.time ? e.time + ' ' : ''}${e.title}`])),
    ...it.tasks.map(t => h('div', { class: 'mini tk' + (t.done ? ' done' : ''), onclick: ev => { ev.stopPropagation(); taskForm(t); } }, `${t.done ? '✓' : '○'} ${t.title}`)),
  ];
  const hb = it.habits.length, ro = it.routines.length;
  if (hb || ro) lines.push(h('div', { class: 'mini muted' }, [hb && `${hb} hábito(s)`, ro && `${ro} rotina(s)`].filter(Boolean).join(' · ')));
  return lines;
}

function weekBody() {
  const s = startOfWeek(cursor);
  return h('div', { class: 'week' }, Array.from({ length: 7 }, (_, i) => {
    const d = addDays(s, i);
    const items = miniItems(d);
    return h('section', { class: 'daycard' + (d === today() ? ' is-today' : ''), onclick: () => { cursor = d; view = 'day'; draw(); } },
      h('div', { class: 'daycard-head' }, h('span', {}, WD_SHORT[i]), h('b', {}, parse(d).getDate())),
      items.length ? items : h('div', { class: 'muted small' }, '—'));
  }));
}

function monthBody() {
  const first = startOfMonth(cursor), p = parse(first);
  const n = daysInMonth(p.getFullYear(), p.getMonth());
  const cells = [];
  for (let i = 0; i < p.getDay(); i++) cells.push(h('div', { class: 'cell blank' }));
  for (let day = 1; day <= n; day++) {
    const d = iso(new Date(p.getFullYear(), p.getMonth(), day));
    const it = dayItems(d);
    const all = [...it.events.map(e => ({ t: e.title, c: 'ev' })), ...it.tasks.map(t => ({ t: t.title, c: 'tk' + (t.done ? ' done' : '') }))];
    cells.push(h('button', { class: 'cell' + (d === today() ? ' is-today' : ''), onclick: () => { cursor = d; view = 'day'; draw(); }, 'aria-label': fmtLong(d) },
      h('span', { class: 'num' }, day),
      all.slice(0, 3).map(x => h('span', { class: 'chip-mini ' + x.c }, x.t)),
      all.length > 3 && h('span', { class: 'more' }, `+${all.length - 3}`)));
  }
  return h('div', { class: 'month' },
    h('div', { class: 'month-head' }, WD_SHORT.map(w => h('span', {}, w))),
    h('div', { class: 'month-grid' }, cells));
}
