/* Lista da casa: o que falta para deixar tudo arrumadinho.
   Itens com grupo, etapa (Falta → Comprado → Pronto) e ordem de prioridade. */
import { h, openForm, ask, toast } from './ui.js';
import { state, commit, uid } from './store.js';
import { icon } from './icons.js';
import { bar, empty, chip, segmented } from './components.js';

const STAGES = [{ k: 'falta', l: 'Falta' }, { k: 'comprado', l: 'Comprado' }, { k: 'pronto', l: 'Pronto' }];
const stageIdx = it => Math.max(0, STAGES.findIndex(s => s.k === it.stage));
let mode = 'grupo', sorting = false;

export const homePending = () => state.home.filter(i => i.stage !== 'pronto').length;
const byOrder = list => [...list].sort((a, b) => a.order - b.order);
const reindex = () => byOrder(state.home).forEach((it, i) => { it.order = i; });
const groups = () => [...new Set([...state.homeGroups, ...state.home.map(i => i.group)])];

function move(it, dir, scope) {
  const s = byOrder(scope), i = s.findIndex(x => x.id === it.id);
  if (dir === 'top') { if (i === 0) return; it.order = s[0].order - 0.5; }
  else { const j = i + dir; if (j < 0 || j >= s.length) return; [it.order, s[j].order] = [s[j].order, it.order]; }
  reindex(); commit();
}

/* ---------- formulários ---------- */
function itemForm(it = null, defGroup = '') {
  openForm({
    title: it ? 'Editar item' : 'Novo item da casa',
    fields: [
      { name: 'title', label: 'O que falta?', required: true, placeholder: 'Ex.: Espelhão para a entrada' },
      { name: 'group', label: 'Grupo', type: 'select', options: [...groups().map(g => ({ v: g, l: g })), { v: '__new', l: '＋ Novo grupo…' }],
        validate: (v, all) => v === '__new' && !all.newGroup ? 'Digite o nome do novo grupo abaixo' : '' },
      { name: 'newGroup', label: 'Nome do novo grupo (só se escolheu "Novo grupo")', placeholder: 'Ex.: Banheiro' },
      { name: 'stage', label: 'Etapa', type: 'select', options: STAGES.map(s => ({ v: s.k, l: s.l })) },
    ],
    values: it ? { ...it, newGroup: '' } : { group: defGroup || groups()[0], stage: 'falta' },
    onSubmit: v => {
      const group = v.group === '__new' ? v.newGroup : v.group;
      if (!state.homeGroups.includes(group)) state.homeGroups.push(group);
      if (it) Object.assign(it, { title: v.title, group, stage: v.stage });
      else state.home.push({ id: uid(), title: v.title, group, stage: v.stage, order: state.home.length });
      reindex(); commit();
    },
    onDelete: it && (() => { state.home = state.home.filter(x => x !== it); reindex(); commit(); }),
  });
}

function groupForm(name) {
  openForm({
    title: 'Grupo',
    fields: [{ name: 'name', label: 'Nome do grupo', required: true }],
    values: { name },
    onSubmit: v => {
      state.homeGroups = [...new Set(groups().map(g => g === name ? v.name : g))];
      state.home.forEach(i => { if (i.group === name) i.group = v.name; });
      commit();
    },
    onDelete: (() => {
      if (state.home.some(i => i.group === name)) return () => toast('Mova ou exclua os itens deste grupo antes.');
      return () => { state.homeGroups = state.homeGroups.filter(g => g !== name); commit(); };
    })(),
  });
}

/* ---------- trazer as tarefas soltas da Casa ---------- */
const movable = () => state.tasks.filter(t => t.areaId === 'casa' && !t.date && !t.goalId && !t.done);
async function migrate() {
  const list = movable();
  if (!await ask(`Mover ${list.length} tarefas da Casa (sem data e sem meta) para a Lista da casa? Elas saem da lista de tarefas.`, 'Mover')) return;
  list.forEach(t => {
    const m = t.title.match(/^(.+?)\s·\s(.+)$/);
    const group = m && groups().includes(m[1]) ? m[1] : (m ? m[1] : 'Outros');
    if (!state.homeGroups.includes(group)) state.homeGroups.push(group);
    state.home.push({ id: uid(), title: m ? m[2] : t.title, group, stage: 'falta', order: state.home.length });
  });
  state.tasks = state.tasks.filter(t => !list.includes(t));
  reindex(); commit(); toast(`${list.length} itens movidos.`);
}

/* ---------- linhas ---------- */
function stageBtn(it) {
  const n = stageIdx(it);
  return h('button', { class: `stage st-${n}`, 'aria-label': `Etapa: ${STAGES[n].l}. Toque para avançar`,
    onclick: e => { e.stopPropagation(); it.stage = STAGES[(n + 1) % 3].k; commit(); } },
    n === 2 ? '✓' : n === 1 ? icon('bag', 14) : '');
}
function itemRow(it, scope, rank) {
  const n = stageIdx(it);
  return h('div', { class: 'row hrow' + (n === 2 ? ' done' : '') },
    rank ? h('span', { class: 'rank' }, rank) : null,
    stageBtn(it),
    h('div', { class: 'row-main', onclick: () => itemForm(it) },
      h('div', { class: 'row-title' }, it.title),
      h('div', { class: 'row-meta' }, n === 1 ? chip('Comprado', 'var(--sys-blue)') : null, rank ? chip(it.group) : null)),
    sorting ? h('div', { class: 'mv' },
      h('button', { class: 'icon-btn sm', 'aria-label': 'Enviar para o topo', onclick: () => move(it, 'top', scope) }, icon('top', 18)),
      h('button', { class: 'icon-btn sm', 'aria-label': 'Subir', onclick: () => move(it, -1, scope) }, icon('up', 18)),
      h('button', { class: 'icon-btn sm', 'aria-label': 'Descer', onclick: () => move(it, 1, scope) }, icon('down', 18))) : null);
}

/* ---------- seção ---------- */
export function homeSection() {
  const all = state.home, total = all.length, ready = all.filter(i => i.stage === 'pronto').length;
  const bought = all.filter(i => i.stage === 'comprado').length, missing = total - ready - bought;
  const cand = movable().length;
  const pct = total ? ready / total : 0;
  const head = h('div', { class: 'sec-head' }, h('h3', {}, [icon('home'), ' Lista da casa']),
    h('button', { class: 'btn sm primary', onclick: () => itemForm() }, '+ Item'));
  const card = h('div', { class: 'card home-card' },
    h('div', { class: 'home-top' }, h('b', {}, total ? `Casa arrumadinha: ${ready} de ${total}` : 'Casa arrumadinha'), h('b', {}, Math.round(pct * 100) + '%')),
    bar(pct, 'var(--sys-orange)'),
    h('p', { class: 'muted small' }, total ? `${missing} faltam · ${bought} comprados · ${ready} prontos` : 'Anote aqui tudo o que falta para deixar a casa do jeito que você quer.'),
    cand ? h('div', { class: 'migrate' }, h('p', { class: 'small' }, `Você tem ${cand} tarefas soltas da Casa. Quer trazê-las para esta lista?`),
      h('button', { class: 'btn sm', onclick: migrate }, `Mover ${cand} tarefas`)) : null,
    total ? h('div', { class: 'toolbar' },
      segmented([['grupo', 'Por grupo'], ['prioridade', 'Prioridade']], mode, k => { mode = k; commit(); }),
      h('button', { class: 'btn sm' + (sorting ? ' primary' : ''), onclick: () => { sorting = !sorting; commit(); } }, [icon('list'), sorting ? ' Pronto' : ' Ordenar'])) : null);

  let body;
  if (!total) body = h('div', {}, empty('Nenhum item ainda. Toque em "+ Item".'));
  else if (mode === 'prioridade') {
    const open = byOrder(all.filter(i => i.stage !== 'pronto')), done = byOrder(all.filter(i => i.stage === 'pronto'));
    body = h('div', {},
      h('p', { class: 'muted small prio-note' }, 'Do mais importante (1) para o menos importante. Toque em "Ordenar" para mudar a ordem.'),
      open.length ? h('div', { class: 'rows' }, open.map((it, i) => itemRow(it, open, i + 1))) : empty('Tudo pronto! Casa arrumadinha.'),
      done.length ? h('details', { class: 'goal-det' }, h('summary', {}, `Prontos (${done.length})`), h('div', { class: 'rows' }, done.map(it => itemRow(it, done)))) : null);
  } else {
    body = h('div', {}, groups().map(g => {
      const list = byOrder(all.filter(i => i.group === g)), r = list.filter(i => i.stage === 'pronto').length;
      return h('div', { class: 'hgroup' },
        h('button', { class: 'hg-head', onclick: () => groupForm(g) }, h('span', {}, g), h('span', { class: 'muted small' }, `${r}/${list.length}`)),
        list.length ? h('div', { class: 'rows' }, list.map(it => itemRow(it, list))) : h('div', { class: 'rows' }, empty('Sem itens neste grupo.')));
    }));
  }
  return h('section', { class: 'sec home' }, head, card, body);
}
