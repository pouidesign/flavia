import { h } from './ui.js';
import { state, commit } from './store.js';
import { today, addDays, parse } from './dates.js';
import { progress, streak, habitDue } from './data.js';
import { check, chip, goalChip, areaChip, goalCard, taskRow, segmented, section, empty } from './components.js';
import { goalForm, taskForm, habitForm, routineForm, routineItemForm } from './forms.js';

let sub = 'goals', tFilter = 'pending', tGoal = 'all', host;
const LET = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function renderPlan(root) {
  host = root;
  const tabs = [['goals', '🎯 Metas'], ['tasks', '✅ Tarefas'], ['habits', '🔁 Hábitos'], ['routines', '🌅 Rotinas']];
  root.replaceChildren(
    h('div', { class: 'subtabs' }, tabs.map(([k, l]) => h('button', { class: k === sub ? 'on' : '', onclick: () => { sub = k; renderPlan(root); } }, l))),
    sub === 'goals' ? goalsView() : sub === 'tasks' ? tasksView() : sub === 'habits' ? habitsView() : routinesView());
}

const head = (text, label, fn) => h('div', { class: 'view-head' }, h('p', { class: 'muted' }, text), h('button', { class: 'btn primary', onclick: fn }, label));

function goalsView() {
  const active = state.goals.filter(g => progress(g) < 1).sort((a, b) => a.deadline < b.deadline ? -1 : 1);
  const done = state.goals.filter(g => progress(g) >= 1);
  return h('div', {},
    head('Metas mensuráveis, com prazo. Tudo o que você faz se liga a uma meta.', '+ Nova meta', () => goalForm()),
    active.length ? h('div', { class: 'grid' }, active.map(g => goalCard(g)))
      : empty('Nenhuma meta ativa. Crie a primeira: defina o que medir, de quanto até quanto, e até quando.'),
    done.length ? section('🏆 Concluídas', [h('div', { class: 'grid' }, done.map(g => goalCard(g)))]) : null);
}

function tasksView() {
  let list = state.tasks.filter(t => tFilter === 'all' || (tFilter === 'pending' ? !t.done : t.done));
  if (tGoal === 'none') list = list.filter(t => !t.goalId); else if (tGoal !== 'all') list = list.filter(t => t.goalId === tGoal);
  list.sort((a, b) => (a.date || '9999') < (b.date || '9999') ? -1 : 1);
  const sel = h('select', { class: 'select', onchange: e => { tGoal = e.target.value; renderPlan(host); } },
    h('option', { value: 'all', selected: tGoal === 'all' }, 'Todas as metas'),
    h('option', { value: 'none', selected: tGoal === 'none' }, 'Avulsas (sem meta)'),
    state.goals.map(g => h('option', { value: g.id, selected: tGoal === g.id }, '🎯 ' + g.title)));
  return h('div', {},
    head('Cada tarefa mostra a meta a que pertence.', '+ Nova tarefa', () => taskForm(null, tGoal !== 'all' && tGoal !== 'none' ? { goalId: tGoal } : {})),
    h('div', { class: 'toolbar' }, segmented([['pending', 'Pendentes'], ['done', 'Feitas'], ['all', 'Todas']], tFilter, k => { tFilter = k; renderPlan(host); }), sel),
    h('div', { class: 'rows' }, list.length ? list.map(t => taskRow(t, { date: true })) : empty('Nada por aqui.')));
}

function habitsView() {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today(), i - 6));
  return h('div', {},
    head('Hábitos diários ou em dias específicos. Marque os últimos 7 dias.', '+ Novo hábito', () => habitForm()),
    state.habits.length ? h('div', { class: 'grid' }, state.habits.map(x => h('article', { class: 'card habit' },
      h('div', { class: 'habit-top' }, h('h3', {}, x.title), h('button', { class: 'btn sm ghost', onclick: () => habitForm(x) }, 'Editar')),
      h('div', { class: 'row-meta' }, h('span', { class: 'time' }, `🔥 ${streak(x)} ${streak(x) === 1 ? 'dia' : 'dias'}`),
        x.goalId ? goalChip(x.goalId) : (x.areaId ? areaChip(x.areaId) : null)),
      h('div', { class: 'strip' }, days.map(d => {
        const due = habitDue(x, d), on = !!x.log[d];
        return h('button', { class: 'dot' + (on ? ' on' : '') + (due ? '' : ' off') + (d === today() ? ' now' : ''), disabled: !due, 'aria-pressed': String(on),
          'aria-label': d, onclick: () => { on ? delete x.log[d] : (x.log[d] = true); commit(); } }, LET[parse(d).getDay()]);
      }))))) : empty('Nenhum hábito ainda.'));
}

function routinesView() {
  return h('div', {},
    head('Rotinas pré-programadas por dia da semana. Aparecem automaticamente na Agenda.', '+ Nova rotina', () => routineForm()),
    state.routines.length ? h('div', { class: 'grid' }, state.routines.map(r => {
      const items = [...r.items].sort((a, b) => (a.time || '99') < (b.time || '99') ? -1 : 1);
      const log = r.log[today()] || {};
      const onToday = r.days.includes(parse(today()).getDay());
      return h('article', { class: 'card routine' + (r.active === false ? ' off' : '') },
        h('div', { class: 'habit-top' }, h('h3', {}, `${r.emoji || '🌅'} ${r.name}`),
          h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: r.active !== false, onchange: e => { r.active = e.target.checked; commit(); } }), h('span', {}, 'ativa'))),
        h('div', { class: 'days ro' }, LET.map((l, i) => h('span', { class: 'day' + (r.days.includes(i) ? ' on' : '') }, l))),
        h('div', { class: 'rows' }, items.length ? items.map(i => h('div', { class: 'row' + (onToday && log[i.id] ? ' done' : '') },
          onToday ? check(log[i.id], () => { r.log[today()] = r.log[today()] || {}; r.log[today()][i.id] ? delete r.log[today()][i.id] : (r.log[today()][i.id] = true); commit(); }) : h('span', { class: 'time' }, i.time || '·'),
          h('div', { class: 'row-main', onclick: () => routineItemForm(r, i) },
            h('div', { class: 'row-title' }, i.title),
            h('div', { class: 'row-meta' }, onToday && i.time && h('span', { class: 'time' }, i.time), i.goalId && goalChip(i.goalId))))) : empty('Sem itens ainda.')),
        h('div', { class: 'actions' },
          h('button', { class: 'btn sm primary', onclick: () => routineItemForm(r) }, '+ Item'),
          h('button', { class: 'btn sm ghost', onclick: () => routineForm(r) }, 'Editar')));
    })) : empty('Nenhuma rotina. Crie uma (ou comece por um modelo de Manhã, Noite ou Treino).'));
}
