import { state, commit, uid } from './store.js';
import { openForm, toast } from './ui.js';
import { goal, progress } from './data.js';
import { today } from './dates.js';

export const areaOptions = blank => [...(blank ? [{ v: '', l: blank }] : []), ...state.areas.map(a => ({ v: a.id, l: `${a.emoji} ${a.name}` }))];
export const goalOptions = sel => [{ v: '', l: '— sem meta (avulsa) —' },
  ...state.goals.filter(g => progress(g) < 1 || g.id === sel).map(g => ({ v: g.id, l: `🎯 ${g.title}` }))];

export function taskForm(t = null, def = {}) {
  openForm({
    title: t ? 'Editar tarefa' : 'Nova tarefa',
    hint: 'Vincule a uma meta para saber a que objetivo ela serve.',
    fields: [
      { name: 'title', label: 'Tarefa', required: true, placeholder: 'O que precisa ser feito?' },
      { name: 'date', label: 'Data', type: 'date' },
      { name: 'time', label: 'Hora', type: 'time' },
      { name: 'goalId', label: 'Meta vinculada', type: 'select', options: goalOptions(t?.goalId ?? def.goalId) },
      { name: 'areaId', label: 'Área (usada só se não houver meta)', type: 'select', options: areaOptions('— sem área —') },
    ],
    values: t || def,
    onSubmit: v => {
      const o = t || { id: uid(), done: false };
      Object.assign(o, { title: v.title, date: v.date || null, time: v.time || null, goalId: v.goalId || null,
        areaId: v.goalId ? goal(v.goalId).areaId : (v.areaId || null) });
      if (!t) state.tasks.push(o);
      commit();
    },
    onDelete: t && (() => { state.tasks = state.tasks.filter(x => x !== t); commit(); }),
  });
}

export function eventForm(e = null, def = {}) {
  openForm({
    title: e ? 'Editar' : (def.type === 'aniversario' ? 'Novo aniversário' : 'Novo compromisso'),
    fields: [
      { name: 'title', label: 'Título', required: true, placeholder: 'Ex.: Consulta, Aniversário da Ana' },
      { name: 'type', label: 'Tipo', type: 'select', options: [{ v: 'compromisso', l: '📌 Compromisso' }, { v: 'aniversario', l: '🎂 Aniversário' }, { v: 'data', l: '⭐ Data especial' }] },
      { name: 'date', label: 'Data (aniversário: data de nascimento)', type: 'date', required: true },
      { name: 'time', label: 'Hora', type: 'time' },
      { name: 'yearly', label: 'Repetir todo ano', type: 'checkbox' },
      { name: 'note', label: 'Observação', type: 'textarea', rows: 2 },
    ],
    values: e || def,
    onSubmit: v => {
      const o = e || { id: uid() };
      Object.assign(o, { title: v.title, type: v.type, date: v.date, time: v.time || null, yearly: v.yearly, note: v.note });
      if (!e) state.events.push(o);
      commit();
    },
    onDelete: e && (() => { state.events = state.events.filter(x => x !== e); commit(); }),
  });
}

export function goalForm(g = null, def = {}) {
  openForm({
    title: g ? 'Editar meta' : 'Nova meta',
    hint: 'Toda meta precisa ser mensurável (número + unidade) e ter prazo.',
    fields: [
      { name: 'title', label: 'Meta', required: true, placeholder: 'Ex.: Correr 10 km sem parar' },
      { name: 'areaId', label: 'Área da vida', type: 'select', required: true, options: areaOptions() },
      { name: 'unit', label: 'Unidade de medida', required: true, placeholder: 'kg, R$, km, livros, %…', max: 16 },
      { name: 'start', label: 'Valor inicial', type: 'number', required: true },
      { name: 'target', label: 'Valor alvo', type: 'number', required: true,
        validate: (v, all) => v === all.start ? 'Precisa ser diferente do valor inicial' : '' },
      { name: 'deadline', label: 'Prazo', type: 'date', required: true,
        validate: v => (!g && v < today()) ? 'O prazo não pode estar no passado' : '' },
      { name: 'why', label: 'Por que essa meta importa? (opcional)', type: 'textarea', rows: 2 },
    ],
    values: g || { areaId: state.areas[0]?.id, ...def },
    onSubmit: v => {
      if (g) {
        const startChanged = v.start !== g.start;
        Object.assign(g, v);
        if (startChanged && !g.log.length) g.current = v.start;
        const ar = g.areaId;
        state.tasks.forEach(t => { if (t.goalId === g.id) t.areaId = ar; });
      } else {
        state.goals.push({ id: uid(), ...v, current: v.start, created: today(), log: [] });
      }
      commit();
    },
    onDelete: g && (() => {
      state.tasks.forEach(t => { if (t.goalId === g.id) t.goalId = null; });
      state.habits.forEach(x => { if (x.goalId === g.id) x.goalId = null; });
      state.routines.forEach(r => r.items.forEach(i => { if (i.goalId === g.id) i.goalId = null; }));
      state.goals = state.goals.filter(x => x !== g);
      commit(); toast('Meta excluída. Itens vinculados ficaram avulsos.');
    }),
  });
}

export function progressForm(g) {
  openForm({
    title: 'Atualizar progresso',
    hint: g.title,
    fields: [
      { name: 'value', label: `Valor atual (${g.unit})`, type: 'number', required: true },
      { name: 'date', label: 'Data', type: 'date', required: true },
      { name: 'note', label: 'Observação', type: 'textarea', rows: 2 },
    ],
    values: { value: g.current, date: today() },
    onSubmit: v => { g.current = v.value; g.log.push({ date: v.date, value: v.value, note: v.note }); commit(); },
  });
}

export function habitForm(x = null, def = {}) {
  openForm({
    title: x ? 'Editar hábito' : 'Novo hábito',
    fields: [
      { name: 'title', label: 'Hábito', required: true, placeholder: 'Ex.: Beber 2 L de água' },
      { name: 'days', label: 'Dias da semana', type: 'days', required: true, default: [0, 1, 2, 3, 4, 5, 6] },
      { name: 'goalId', label: 'Meta vinculada', type: 'select', options: goalOptions(x?.goalId) },
      { name: 'areaId', label: 'Área (usada só se não houver meta)', type: 'select', options: areaOptions('— sem área —') },
    ],
    values: x || def,
    onSubmit: v => {
      const o = x || { id: uid(), log: {} };
      Object.assign(o, { title: v.title, days: v.days, goalId: v.goalId || null, areaId: v.goalId ? goal(v.goalId).areaId : (v.areaId || null) });
      if (!x) state.habits.push(o);
      commit();
    },
    onDelete: x && (() => { state.habits = state.habits.filter(y => y !== x); commit(); }),
  });
}

const TEMPLATES = {
  manha: { name: 'Manhã', emoji: '🌅', items: [['06:30', 'Acordar e beber água'], ['06:45', 'Alongar 10 min'], ['07:00', 'Planejar o dia']] },
  noite: { name: 'Noite', emoji: '🌙', items: [['21:00', 'Desligar telas'], ['21:30', 'Diário / gratidão'], ['22:00', 'Dormir']] },
  treino: { name: 'Treino', emoji: '💪', items: [['18:00', 'Aquecimento'], ['18:15', 'Treino'], ['19:00', 'Alongamento']] },
};

export function routineForm(r = null) {
  openForm({
    title: r ? 'Editar rotina' : 'Nova rotina',
    hint: r ? '' : 'Você pode ter várias rotinas, cada uma em seus dias da semana.',
    fields: [
      { name: 'name', label: 'Nome', required: true, placeholder: 'Ex.: Manhã, Noite, Dia de treino' },
      { name: 'emoji', label: 'Emoji', placeholder: '🌅', max: 4 },
      { name: 'days', label: 'Dias em que acontece', type: 'days', required: true, default: [1, 2, 3, 4, 5] },
      !r && { name: 'tpl', label: 'Começar com modelo', type: 'select', options: [{ v: '', l: 'Em branco' }, ...Object.entries(TEMPLATES).map(([k, t]) => ({ v: k, l: `${t.emoji} ${t.name}` }))] },
    ].filter(Boolean),
    values: r || {},
    onSubmit: v => {
      const o = r || { id: uid(), items: [], log: {}, active: true };
      Object.assign(o, { name: v.name, emoji: v.emoji || '🌅', days: v.days });
      if (!r && v.tpl) o.items = TEMPLATES[v.tpl].items.map(([time, title]) => ({ id: uid(), time, title, goalId: null }));
      if (!r) state.routines.push(o);
      commit();
    },
    onDelete: r && (() => { state.routines = state.routines.filter(x => x !== r); commit(); }),
  });
}

export function routineItemForm(r, item = null) {
  openForm({
    title: item ? 'Editar item' : `Novo item em "${r.name}"`,
    fields: [
      { name: 'title', label: 'Item', required: true, placeholder: 'Ex.: Meditar 10 min' },
      { name: 'time', label: 'Hora', type: 'time' },
      { name: 'goalId', label: 'Meta vinculada', type: 'select', options: goalOptions(item?.goalId) },
    ],
    values: item || {},
    onSubmit: v => {
      const o = item || { id: uid() };
      Object.assign(o, { title: v.title, time: v.time || null, goalId: v.goalId || null });
      if (!item) r.items.push(o);
      commit();
    },
    onDelete: item && (() => { r.items = r.items.filter(i => i !== item); commit(); }),
  });
}

export function areaForm(a = null) {
  openForm({
    title: a ? 'Editar área' : 'Nova área da vida',
    fields: [
      { name: 'name', label: 'Nome', required: true, placeholder: 'Ex.: Espiritualidade' },
      { name: 'emoji', label: 'Emoji', required: true, placeholder: '✨', max: 4 },
      { name: 'color', label: 'Cor', type: 'swatches', options: ['#4fb7a5', '#6b8cef', '#e9b44c', '#e5707e', '#f0a26b', '#a07be0', '#5bbcd6', '#8fcf8f', '#d98bc4', '#8a8fa3'] },
    ],
    values: a || {},
    onSubmit: v => {
      if (a) Object.assign(a, v); else state.areas.push({ id: uid(), ...v });
      commit();
    },
    onDelete: a && (() => {
      if (state.goals.some(g => g.areaId === a.id)) { toast('Mova ou exclua as metas desta área antes.'); return; }
      state.tasks.forEach(t => { if (t.areaId === a.id) t.areaId = null; });
      state.habits.forEach(x => { if (x.areaId === a.id) x.areaId = null; });
      state.areas = state.areas.filter(x => x !== a); commit();
    }),
  });
}
