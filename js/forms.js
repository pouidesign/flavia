import { state, commit, uid } from './store.js';
import { openForm, toast } from './ui.js';
import { goal, progress } from './data.js';
import { today } from './dates.js';
import { AREA_ICONS, ROUTINE_ICONS, areaIcon, routineIcon } from './icons.js';

export const areaOptions = blank => [...(blank ? [{ v: '', l: blank }] : []), ...state.areas.map(a => ({ v: a.id, l: a.name }))];
export const goalOptions = sel => [{ v: '', l: '— sem meta (avulsa) —' },
  ...state.goals.filter(g => progress(g) < 1 || g.id === sel).map(g => ({ v: g.id, l: g.title }))];

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
      { name: 'type', label: 'Tipo', type: 'select', options: [{ v: 'compromisso', l: 'Compromisso' }, { v: 'aniversario', l: 'Aniversário' }, { v: 'data', l: 'Data especial' }] },
      { name: 'date', label: 'Data (vazio = hoje; aniversário: nascimento)', type: 'date' },
      { name: 'time', label: 'Hora', type: 'time' },
      { name: 'yearly', label: 'Repetir todo ano', type: 'checkbox' },
      { name: 'noYear', label: 'Não sei o ano (não mostrar a idade)', type: 'checkbox' },
      { name: 'note', label: 'Observação', type: 'textarea', rows: 2 },
    ],
    values: e || def,
    onSubmit: v => {
      const o = e || { id: uid() };
      Object.assign(o, { title: v.title, type: v.type, date: v.date || def.date || today(), time: v.time || null, yearly: v.yearly, noYear: v.noYear, note: v.note });
      if (!e) state.events.push(o);
      commit();
    },
    onDelete: e && (() => { state.events = state.events.filter(x => x !== e); commit(); }),
  });
}

export function goalForm(g = null, def = {}) {
  openForm({
    title: g ? 'Editar meta' : 'Nova meta',
    hint: 'Só o nome é obrigatório. Preencha unidade, valores e prazo quando quiser: aí a meta ganha barra de progresso.',
    fields: [
      { name: 'title', label: 'Meta', required: true, placeholder: 'Ex.: Correr 10 km sem parar' },
      { name: 'areaId', label: 'Área da vida', type: 'select', options: areaOptions('— sem área —') },
      { name: 'unit', label: 'Unidade de medida (opcional)', placeholder: 'kg, R$, km, livros, %…', max: 16 },
      { name: 'start', label: 'Valor inicial (opcional)', type: 'number' },
      { name: 'target', label: 'Valor alvo (opcional)', type: 'number',
        validate: (v, all) => v === all.start ? 'Precisa ser diferente do valor inicial' : '' },
      { name: 'deadline', label: 'Prazo (opcional)', type: 'date' },
      { name: 'why', label: 'Por que essa meta importa? (opcional)', type: 'textarea', rows: 2 },
    ],
    values: g || { areaId: state.areas[0]?.id, ...def },
    onSubmit: v => {
      if (g) {
        const startChanged = v.start !== g.start;
        Object.assign(g, v, { start: v.start ?? (v.target != null ? 0 : null), deadline: v.deadline || null, areaId: v.areaId || null, unit: v.unit || '' });
        if ((startChanged && !g.log.length) || g.current == null) g.current = g.start;
        const ar = g.areaId;
        state.tasks.forEach(t => { if (t.goalId === g.id) t.areaId = ar; });
      } else {
        const start = v.start ?? (v.target != null ? 0 : null);
        state.goals.push({ id: uid(), ...v, start, areaId: v.areaId || null, deadline: v.deadline || null, current: start, done: false, created: today(), log: [] });
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
      { name: 'value', label: `Valor atual${g.unit ? ' (' + g.unit + ')' : ''}`, type: 'number' },
      { name: 'date', label: 'Data', type: 'date' },
      { name: 'note', label: 'Observação', type: 'textarea', rows: 2 },
    ],
    values: { value: g.current ?? g.start, date: today() },
    onSubmit: v => { if (v.value == null) return; g.current = v.value; g.log.push({ date: v.date || today(), value: v.value, note: v.note }); commit(); },
  });
}

export function habitForm(x = null, def = {}) {
  openForm({
    title: x ? 'Editar hábito' : 'Novo hábito',
    fields: [
      { name: 'title', label: 'Hábito', required: true, placeholder: 'Ex.: Beber 2 L de água' },
      { name: 'days', label: 'Dias da semana (vazio = todos os dias)', type: 'days', default: [0, 1, 2, 3, 4, 5, 6] },
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
  manha: { name: 'Manhã', icon: 'sunrise', items: [['06:30', 'Acordar e beber água'], ['06:45', 'Alongar 10 min'], ['07:00', 'Planejar o dia']] },
  noite: { name: 'Noite', icon: 'moon', items: [['21:00', 'Desligar telas'], ['21:30', 'Diário / gratidão'], ['22:00', 'Dormir']] },
  treino: { name: 'Treino', icon: 'dumbbell', items: [['18:00', 'Aquecimento'], ['18:15', 'Treino'], ['19:00', 'Alongamento']] },
};

export function routineForm(r = null) {
  openForm({
    title: r ? 'Editar rotina' : 'Nova rotina',
    hint: r ? '' : 'Você pode ter várias rotinas, cada uma em seus dias da semana.',
    fields: [
      { name: 'name', label: 'Nome', required: true, placeholder: 'Ex.: Manhã, Noite, Dia de treino' },
      { name: 'icon', label: 'Ícone', type: 'icons', options: ROUTINE_ICONS, default: 'sunrise' },
      { name: 'days', label: 'Dias em que acontece (vazio = todos os dias)', type: 'days', default: [1, 2, 3, 4, 5] },
      !r && { name: 'tpl', label: 'Começar com modelo', type: 'select', options: [{ v: '', l: 'Em branco' }, ...Object.entries(TEMPLATES).map(([k, t]) => ({ v: k, l: t.name }))] },
    ].filter(Boolean),
    values: r ? { ...r, icon: routineIcon(r) } : {},
    onSubmit: v => {
      const o = r || { id: uid(), items: [], log: {}, active: true };
      Object.assign(o, { name: v.name, icon: v.icon, days: v.days }); delete o.emoji;
      if (!r && v.tpl) { o.icon = TEMPLATES[v.tpl].icon; o.items = TEMPLATES[v.tpl].items.map(([time, title]) => ({ id: uid(), time, title, goalId: null })); }
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
      { name: 'icon', label: 'Ícone', type: 'icons', options: AREA_ICONS, default: 'sparkle' },
      { name: 'color', label: 'Cor', type: 'swatches', options: ['green', 'blue', 'yellow', 'pink', 'orange', 'purple', 'teal', 'mint', 'indigo', 'brown'].map(c => `var(--sys-${c})`) },
    ],
    values: a ? { ...a, icon: areaIcon(a) } : {},
    onSubmit: v => {
      if (a) { Object.assign(a, v); delete a.emoji; } else state.areas.push({ id: uid(), ...v });
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
