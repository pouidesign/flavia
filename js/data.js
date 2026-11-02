import { state } from './store.js';
import { parse, today, addDays } from './dates.js';

export const area = id => state.areas.find(a => a.id === id);
export const goal = id => state.goals.find(g => g.id === id);
export const areaOf = it => (it.goalId && goal(it.goalId)) ? goal(it.goalId).areaId : it.areaId;

/** Meta com número (valor inicial e alvo diferentes) tem barra; sem número é "meta simples". */
export const isMeasurable = g => g.target != null && g.start != null && g.target !== g.start;
export function progress(g) {
  if (!isMeasurable(g)) return g.done ? 1 : 0;
  return Math.max(0, Math.min(1, ((g.current ?? g.start) - g.start) / (g.target - g.start)));
}
export const byDeadline = (a, b) => (a.deadline || '9999') < (b.deadline || '9999') ? -1 : 1;
export const fmtNum = n => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export function eventOn(e, date) {
  if (e.date === date) return true;
  const yearly = e.type === 'aniversario' || e.yearly;
  return !!(yearly && e.date.slice(5) === date.slice(5) && e.date.slice(0, 4) <= date.slice(0, 4));
}
export const ageOn = (e, date) => e.noYear ? 0 : +date.slice(0, 4) - +e.date.slice(0, 4);

export const habitDue = (h, date) => (h.days?.length ? h.days : [0, 1, 2, 3, 4, 5, 6]).includes(parse(date).getDay());
/** Rotina sem dias marcados acontece todo dia. */
export const routineDue = (r, date) => !r.days?.length || r.days.includes(parse(date).getDay());
export const routinesOn = date => state.routines.filter(r => r.active !== false && routineDue(r, date));

const byTime = (a, b) => (a.time || '99:99') < (b.time || '99:99') ? -1 : 1;
export function dayItems(date) {
  return {
    events: state.events.filter(e => eventOn(e, date)).sort(byTime),
    tasks: state.tasks.filter(t => t.date === date).sort(byTime),
    habits: state.habits.filter(h => habitDue(h, date)),
    routines: routinesOn(date),
  };
}

export function streak(h) {
  let d = h.log[today()] ? today() : addDays(today(), -1), n = 0;
  for (let i = 0; i < 800; i++, d = addDays(d, -1)) {
    if (!habitDue(h, d)) continue;
    if (h.log[d]) n++; else break;
  }
  return n;
}
