import { h } from './ui.js';
import { icon, areaIcon, routineIcon } from './icons.js';
import { state, commit } from './store.js';
import { area, goal, progress, fmtNum } from './data.js';
import { today, diffDays, fmtBR, fmtShort } from './dates.js';
import { taskForm, goalForm, progressForm } from './forms.js';

export const chip = (text, color, onclick) => h('span', { class: 'chip', style: { '--c': color || null }, onclick }, text);
export const areaChip = id => { const a = area(id); return a ? chip([icon(areaIcon(a)), ' ' + a.name], a.color) : null; };
export const goalChip = id => { const g = goal(id); return g ? chip([icon('target'), ' ' + g.title], area(g.areaId)?.color) : null; };
export const bar = (p, color) => h('div', { class: 'bar' }, h('i', { style: { width: Math.round(p * 100) + '%', background: color || 'var(--accent)' } }));
export const check = (on, fn) => h('button', { class: 'check' + (on ? ' on' : ''), 'aria-pressed': String(!!on), 'aria-label': 'Concluir', onclick: e => { e.stopPropagation(); fn(); } }, on ? '✓' : '');
export const empty = text => h('p', { class: 'empty' }, text);
export const section = (title, children, action) => h('section', { class: 'sec' },
  h('div', { class: 'sec-head' }, h('h3', {}, title), action), h('div', { class: 'rows' }, children));
export const segmented = (opts, cur, fn) => h('div', { class: 'seg', role: 'tablist' },
  opts.map(([k, l]) => h('button', { class: k === cur ? 'on' : '', role: 'tab', 'aria-selected': String(k === cur), onclick: () => fn(k) }, l)));

export function taskRow(t, { date = false } = {}) {
  const meta = [];
  if (date && t.date) meta.push(h('span', { class: 'time' }, fmtShort(t.date)));
  if (t.time) meta.push(h('span', { class: 'time' }, t.time));
  if (t.goalId && goal(t.goalId)) meta.push(...[ goalChip(t.goalId) ]);
  else if (t.areaId) meta.push(areaChip(t.areaId), chip('avulsa'));
  else meta.push(chip('avulsa'));
  return h('div', { class: 'row' + (t.done ? ' done' : '') },
    check(t.done, () => { t.done = !t.done; commit(); }),
    h('div', { class: 'row-main', onclick: () => taskForm(t) },
      h('div', { class: 'row-title' }, t.title), h('div', { class: 'row-meta' }, meta)));
}

const openGoals = new Set();

export function goalCard(g) {
  const a = area(g.areaId), p = progress(g), left = diffDays(today(), g.deadline), done = p >= 1;
  const tasks = state.tasks.filter(t => t.goalId === g.id);
  const habits = state.habits.filter(x => x.goalId === g.id);
  const ritems = state.routines.flatMap(r => r.items.filter(i => i.goalId === g.id).map(i => ({ r, i })));

  let status;
  if (done) status = chip([icon('check'), ' Concluída'], 'var(--success)');
  else if (left < 0) status = chip([icon('warning'), ` Atrasada ${-left}d`], 'var(--danger)');
  else if (left === 0) status = chip([icon('clock'), ' Vence hoje'], 'var(--warning)');
  else status = chip([icon('clock'), ` ${left} ${left === 1 ? 'dia' : 'dias'} · ${fmtBR(g.deadline)}`]);

  let pace = null;
  if (!done && left >= 0) {
    const total = Math.max(1, diffDays(g.created || today(), g.deadline));
    const expected = Math.min(1, diffDays(g.created || today(), today()) / total);
    pace = h('span', { class: 'pace ' + (p + 0.05 >= expected ? 'ok' : 'late') }, p + 0.05 >= expected ? 'no ritmo' : 'abaixo do ritmo');
  }

  const doneTasks = tasks.filter(t => t.done).length;
  const det = h('details', { class: 'goal-det', open: openGoals.has(g.id), ontoggle: e => { e.target.open ? openGoals.add(g.id) : openGoals.delete(g.id); } },
    h('summary', {}, `Vinculado: ${tasks.length} tarefa(s) · ${habits.length} hábito(s) · ${ritems.length} item(ns) de rotina`),
    h('div', { class: 'rows' },
      tasks.length ? tasks.map(t => taskRow(t, { date: true })) : empty('Nenhuma tarefa vinculada ainda.'),
      habits.map(x => h('div', { class: 'row link' }, h('span', { class: 'lead-ico' }, icon('repeat', 20)), h('div', { class: 'row-main' }, h('div', { class: 'row-title' }, x.title)))),
      ritems.map(({ r, i }) => h('div', { class: 'row link' }, h('span', { class: 'lead-ico' }, icon(routineIcon(r), 20)), h('div', { class: 'row-main' }, h('div', { class: 'row-title' }, i.title), h('div', { class: 'row-meta' }, chip(r.name)))))));

  return h('article', { class: 'card goal' + (done ? ' is-done' : ''), style: { '--c': a?.color } },
    h('div', { class: 'goal-top' }, areaChip(g.areaId), status, pace),
    h('h3', { class: 'goal-title' }, g.title),
    h('div', { class: 'goal-prog' },
      bar(p, a?.color),
      h('div', { class: 'goal-nums' },
        h('span', {}, `${fmtNum(g.current)} / ${fmtNum(g.target)} ${g.unit}`),
        h('b', {}, Math.round(p * 100) + '%'))),
    g.why && h('p', { class: 'why' }, g.why),
    tasks.length ? h('div', { class: 'muted small' }, `Tarefas: ${doneTasks}/${tasks.length} concluídas`) : null,
    det,
    h('div', { class: 'actions' },
      h('button', { class: 'btn sm primary', onclick: () => progressForm(g) }, 'Atualizar progresso'),
      h('button', { class: 'btn sm', onclick: () => taskForm(null, { goalId: g.id }) }, '+ Tarefa'),
      h('button', { class: 'btn sm ghost', onclick: () => goalForm(g) }, 'Editar')));
}
