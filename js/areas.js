import { h, svg } from './ui.js';
import { icon, areaIcon, routineIcon } from './icons.js';
import { state, commit } from './store.js';
import { progress, byDeadline } from './data.js';
import { check, goalCard, taskRow, section, empty, chip } from './components.js';
import { areaForm, goalForm, taskForm } from './forms.js';
import { today } from './dates.js';
import { homeSection, homePending } from './home.js';

let current = null, host;

export function renderAreas(root) {
  host = root;
  const a = state.areas.find(x => x.id === current);
  root.replaceChildren(a ? detail(a) : overview());
}

const avg = goals => goals.length ? goals.reduce((s, g) => s + progress(g), 0) / goals.length : 0;

function ring(p, color, label) {
  const r = 26, c = 2 * Math.PI * r;
  return svg('svg', { viewBox: '0 0 64 64', class: 'ring', width: 64, height: 64, role: 'img', 'aria-label': `${Math.round(p * 100)}% de progresso` },
    svg('circle', { cx: 32, cy: 32, r, fill: 'none', stroke: 'var(--fill)', 'stroke-width': 7 }),
    svg('circle', { cx: 32, cy: 32, r, fill: 'none', stroke: color, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-dasharray': `${c * p} ${c}`, transform: 'rotate(-90 32 32)' }),
    svg('text', { x: 32, y: 36, 'text-anchor': 'middle', class: 'ring-t' }, label));
}

function overview() {
  return h('div', {},
    h('div', { class: 'view-head' }, h('p', { class: 'muted' }, 'Áreas da vida. Toque em uma para mergulhar nas metas e rotinas dela.'),
      h('button', { class: 'btn', onclick: () => areaForm() }, '+ Nova área')),
    h('div', { class: 'area-grid' }, state.areas.map(a => {
      const goals = state.goals.filter(g => g.areaId === a.id), active = goals.filter(g => progress(g) < 1);
      const pend = state.tasks.filter(t => !t.done && (t.goalId ? state.goals.find(g => g.id === t.goalId)?.areaId === a.id : t.areaId === a.id)).length + (a.id === 'casa' ? homePending() : 0);
      const p = avg(goals);
      return h('button', { class: 'area-card', style: { '--c': a.color }, onclick: () => { current = a.id; renderAreas(host); } },
        h('span', { class: 'area-emoji' }, icon(areaIcon(a), 30)),
        h('b', {}, a.name),
        h('span', { class: 'muted small' }, `${active.length} meta(s) ativa(s) · ${pend} tarefa(s)`),
        ring(p, a.color, Math.round(p * 100) + '%'));
    })));
}

function detail(a) {
  const goals = state.goals.filter(g => g.areaId === a.id);
  const active = goals.filter(g => progress(g) < 1).sort(byDeadline), done = goals.filter(g => progress(g) >= 1);
  const inArea = it => (it.goalId ? state.goals.find(g => g.id === it.goalId)?.areaId : it.areaId) === a.id;
  const tasks = state.tasks.filter(t => !t.done && inArea(t)).sort((x, y) => (x.date || '9999') < (y.date || '9999') ? -1 : 1);
  const habits = state.habits.filter(inArea);
  const ritems = state.routines.flatMap(r => r.items.filter(i => i.goalId && state.goals.find(g => g.id === i.goalId)?.areaId === a.id).map(i => ({ r, i })));
  return h('div', { class: 'area-detail', style: { '--c': a.color } },
    h('div', { class: 'area-head' },
      h('button', { class: 'btn ghost', onclick: () => { current = null; renderAreas(host); } }, [icon('back'), ' Áreas']),
      h('h2', {}, icon(areaIcon(a), 24), ' ', a.name),
      h('button', { class: 'btn ghost', onclick: () => areaForm(a) }, 'Editar')),
    h('div', { class: 'area-summary card' }, ring(avg(goals), a.color, Math.round(avg(goals) * 100) + '%'),
      h('div', {}, h('b', {}, `${active.length} meta(s) ativa(s)`), h('div', { class: 'muted small' }, `${done.length} concluída(s) · ${tasks.length} tarefa(s) pendente(s) · ${habits.length} hábito(s)`))),
    a.id === 'casa' ? homeSection() : null,
    section('Metas', active.length ? [h('div', { class: 'grid' }, active.map(g => goalCard(g)))] : [empty('Nenhuma meta ativa nesta área.')],
      h('button', { class: 'btn sm primary', onclick: () => goalForm(null, { areaId: a.id }) }, '+ Meta')),
    tasks.length ? section('Tarefas pendentes', tasks.map(t => taskRow(t, { date: true })), h('button', { class: 'btn sm', onclick: () => taskForm(null, { areaId: a.id }) }, '+ Tarefa')) : null,
    habits.length ? section('Hábitos', habits.map(x => h('div', { class: 'row link' }, h('span', { class: 'lead-ico' }, icon('repeat', 20)), h('div', { class: 'row-main' }, h('div', { class: 'row-title' }, x.title))))) : null,
    ritems.length ? section('Rotinas ligadas às metas', ritems.map(({ r, i }) => h('div', { class: 'row link' }, h('span', { class: 'lead-ico' }, icon(routineIcon(r), 20)), h('div', { class: 'row-main' }, h('div', { class: 'row-title' }, i.title), h('div', { class: 'row-meta' }, chip(r.name)))))) : null,
    done.length ? section([icon('trophy'), ' Concluídas'], [h('div', { class: 'grid' }, done.map(g => goalCard(g)))]) : null);
}
