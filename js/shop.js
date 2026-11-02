/* Compras: listas por categoria, com quantidade, valor estimado, observação, link e prioridade.
   Marcar a bolinha risca o item e o leva para "Comprados", que continua visível. */
import { h, openForm, ask, toast } from './ui.js';
import { state, commit, uid } from './store.js';
import { icon } from './icons.js';
import { bar, empty, chip, segmented, doneBlock, newestFirst } from './components.js';
import { movable, splitPrefix } from './home.js';

let mode = 'categoria', sorting = false, lastCat = '';
const brl = n => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const sum = list => list.reduce((s, i) => s + (Number(i.price) || 0), 0);
const byOrder = list => [...list].sort((a, b) => a.order - b.order);
const reindex = () => byOrder(state.shop).forEach((it, i) => { it.order = i; });
const cats = () => [...new Set([...state.shopCats, ...state.shop.map(i => i.cat)])];
const safeUrl = u => { try { const x = new URL(/^https?:\/\//i.test(u) ? u : 'https://' + u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };

function move(it, dir, scope) {
  const s = byOrder(scope), i = s.findIndex(x => x.id === it.id);
  if (dir === 'top') { if (i === 0) return; it.order = s[0].order - 0.5; }
  else { const j = i + dir; if (j < 0 || j >= s.length) return; [it.order, s[j].order] = [s[j].order, it.order]; }
  reindex(); commit();
}

/* ---------- trazer os itens da casa (sem copiar e colar) ---------- */
const GROUP_CAT = { 'Festa': 'Festa (pet)', 'Área externa': 'Área externa', 'Dentro de casa': 'Casa (móveis e decoração)', 'Compras e serviços': 'Casa (móveis e decoração)', 'Limpeza': 'Dia a dia da casa' };
const DIA = /extensor|filtro|vassoura|mosquit|org[aâ]nico|diarista|limpeza|detergente|esponja|papel/i, ROUPA = /costureira|ajustar/i;
const norm = t => t.trim().toLowerCase().replace(/\s+/g, ' ');
function catFor(group, title) {
  if (ROUPA.test(title)) return 'Roupas';
  let c = GROUP_CAT[group] || group || 'Casa (móveis e decoração)';
  if (c === 'Casa (móveis e decoração)' && DIA.test(title)) c = 'Dia a dia da casa';
  return c;
}
/** Itens da Lista da casa e tarefas soltas da Casa que ainda não estão em Compras. */
function bringable() {
  const have = new Set(state.shop.map(i => norm(i.title))), seen = new Set(), out = [];
  const src = [...state.home.map(i => ({ title: i.title, group: i.group, done: i.stage !== 'falta' })),
    ...movable().map(t => { const p = splitPrefix(t.title); return { title: p.title, group: p.group, done: false }; })];
  for (const s of src) { const k = norm(s.title); if (!k || have.has(k) || seen.has(k)) continue; seen.add(k); out.push({ ...s, cat: catFor(s.group, s.title) }); }
  return out;
}
async function bring() {
  const list = bringable(), by = {};
  list.forEach(i => { by[i.cat] = (by[i.cat] || 0) + 1; });
  const resumo = Object.entries(by).map(([c, n]) => `${c}: ${n}`).join(' · ');
  if (!await ask(`Trazer ${list.length} ${list.length === 1 ? 'item' : 'itens'} da casa para Compras? (${resumo}). Eles continuam na Lista da casa e nas tarefas.`, 'Trazer')) return;
  list.forEach(i => {
    if (!state.shopCats.includes(i.cat)) state.shopCats.push(i.cat);
    state.shop.push({ id: uid(), title: i.title, cat: i.cat, qty: '', price: null, link: '', note: '', done: i.done, doneAt: i.done ? Date.now() : null, order: state.shop.length });
  });
  reindex(); commit(); toast(list.length === 1 ? '1 item adicionado em Compras.' : `${list.length} itens adicionados em Compras.`);
}

/* ---------- formulários ---------- */
function itemForm(it = null, defCat = '') {
  openForm({
    title: it ? 'Editar item' : 'Novo item de compra',
    fields: [
      { name: 'title', label: 'O que comprar?', required: true, placeholder: 'Ex.: Cadeiras de praia' },
      { name: 'cat', label: 'Categoria', type: 'select', options: [...cats().map(c => ({ v: c, l: c })), { v: '__new', l: '＋ Nova categoria…' }],
        validate: (v, all) => v === '__new' && !all.newCat ? 'Digite o nome da nova categoria abaixo' : '' },
      { name: 'newCat', label: 'Nome da nova categoria (só se escolheu "Nova categoria")', placeholder: 'Ex.: Cozinha' },
      { name: 'qty', label: 'Quantidade (opcional)', placeholder: 'Ex.: 2, 1 kg, 3 caixas' },
      { name: 'price', label: 'Valor estimado em R$ (opcional, total do item)', type: 'number' },
      { name: 'link', label: 'Link da loja (opcional)', placeholder: 'https://…', type: 'url' },
      { name: 'note', label: 'Observação (opcional)', type: 'textarea', rows: 2, placeholder: 'Medidas, cor, modelo…' },
    ],
    values: it ? { ...it, newCat: '' } : { cat: defCat || lastCat || cats()[0] },
    onSubmit: v => {
      const cat = v.cat === '__new' ? v.newCat : v.cat;
      if (!state.shopCats.includes(cat)) state.shopCats.push(cat);
      lastCat = cat;
      const data = { title: v.title, cat, qty: v.qty, price: v.price, link: v.link, note: v.note };
      if (it) Object.assign(it, data); else state.shop.push({ id: uid(), done: false, doneAt: null, order: state.shop.length, ...data });
      reindex(); commit();
    },
    onDelete: it && (() => { state.shop = state.shop.filter(x => x !== it); reindex(); commit(); }),
  });
}

function catForm(name) {
  openForm({
    title: name ? 'Categoria' : 'Nova categoria',
    fields: [{ name: 'name', label: 'Nome da categoria', required: true }],
    values: { name },
    onSubmit: v => {
      if (!name) { if (!cats().includes(v.name)) state.shopCats.push(v.name); }
      else {
        state.shopCats = [...new Set(cats().map(c => c === name ? v.name : c))];
        state.shop.forEach(i => { if (i.cat === name) i.cat = v.name; });
      }
      commit();
    },
    onDelete: !name ? null : state.shop.some(i => i.cat === name)
      ? () => toast('Mova ou exclua os itens desta categoria antes.')
      : () => { state.shopCats = state.shopCats.filter(c => c !== name); commit(); },
  });
}

/* ---------- linhas ---------- */
function toggle(it) { it.done = !it.done; it.doneAt = it.done ? Date.now() : null; commit(); }
function itemRow(it, scope, rank) {
  const url = it.link ? safeUrl(it.link) : null;
  return h('div', { class: 'row shop-row' + (it.done ? ' done' : '') },
    rank ? h('span', { class: 'rank' }, rank) : null,
    h('button', { class: 'check' + (it.done ? ' on' : ''), 'aria-pressed': String(it.done), 'aria-label': it.done ? 'Desmarcar' : 'Marcar como comprado', onclick: e => { e.stopPropagation(); toggle(it); } }, it.done ? '✓' : ''),
    h('div', { class: 'row-main', onclick: () => itemForm(it) },
      h('div', { class: 'row-title' }, it.title),
      h('div', { class: 'row-meta' }, it.qty ? chip(it.qty) : null, it.price != null ? chip(brl(it.price), 'var(--sys-green)') : null, rank ? chip(it.cat) : null),
      it.note ? h('div', { class: 'muted small shop-note' }, it.note) : null),
    url ? h('a', { class: 'icon-btn sm', href: url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Abrir link da loja', onclick: e => e.stopPropagation() }, icon('link', 18)) : null,
    sorting && !it.done ? h('div', { class: 'mv' },
      h('button', { class: 'icon-btn sm', 'aria-label': 'Enviar para o topo', onclick: () => move(it, 'top', scope) }, icon('top', 18)),
      h('button', { class: 'icon-btn sm', 'aria-label': 'Subir', onclick: () => move(it, -1, scope) }, icon('up', 18)),
      h('button', { class: 'icon-btn sm', 'aria-label': 'Descer', onclick: () => move(it, 1, scope) }, icon('down', 18))) : null);
}

/* ---------- tela ---------- */
export function renderShop(root) {
  const all = state.shop, pendAll = all.filter(i => !i.done), finAll = all.filter(i => i.done).sort(newestFirst);
  const pct = all.length ? finAll.length / all.length : 0;
  const top = h('div', { class: 'view-head' }, h('p', { class: 'muted' }, 'Toque na bolinha ao comprar: o item é riscado e vai para Comprados.'),
    h('button', { class: 'btn primary', onclick: () => itemForm() }, '+ Item'));
  const card = h('div', { class: 'card home-card' },
    h('div', { class: 'home-top' }, h('b', {}, all.length ? `Faltam ${pendAll.length} de ${all.length}` : 'Lista de compras'), h('b', {}, pendAll.length && sum(pendAll) ? brl(sum(pendAll)) : '')),
    bar(pct, 'var(--sys-green)'),
    h('p', { class: 'muted small' }, all.length
      ? `${finAll.length} ${finAll.length === 1 ? 'comprado' : 'comprados'}${sum(finAll) ? ' · ' + brl(sum(finAll)) + ' gastos' : ''}${sum(pendAll) ? ' · ' + brl(sum(pendAll)) + ' ainda estimados' : ''}`
      : 'Anote o que precisa comprar e organize por categoria.'),
    bringable().length ? h('div', { class: 'migrate' }, h('p', { class: 'small' }, `Você tem ${bringable().length} ${bringable().length === 1 ? 'item' : 'itens'} da casa que ainda não ${bringable().length === 1 ? 'está' : 'estão'} aqui.`),
      h('button', { class: 'btn sm', onclick: bring }, `Trazer ${bringable().length} ${bringable().length === 1 ? 'item' : 'itens'}`)) : null,
    all.length ? h('div', { class: 'toolbar' },
      segmented([['categoria', 'Por categoria'], ['prioridade', 'Prioridade']], mode, k => { mode = k; commit(); }),
      h('button', { class: 'btn sm' + (sorting ? ' primary' : ''), onclick: () => { sorting = !sorting; commit(); } }, [icon('list'), sorting ? ' Pronto' : ' Ordenar'])) : null);

  let body;
  if (mode === 'prioridade' && all.length) {
    const open = byOrder(pendAll);
    body = h('div', {},
      h('p', { class: 'muted small prio-note' }, 'Do mais importante (1) para o menos importante. Toque em "Ordenar" para mudar a ordem.'),
      open.length ? h('div', { class: 'rows' }, open.map((it, i) => itemRow(it, open, i + 1))) : empty('Tudo comprado!'),
      doneBlock('shop-prio-done', 'Comprados', finAll.map(it => itemRow(it, finAll))));
  } else {
    body = h('div', {}, cats().map(c => {
      const list = byOrder(all.filter(i => i.cat === c)), pend = list.filter(i => !i.done), fin = list.filter(i => i.done).sort(newestFirst);
      return h('div', { class: 'hgroup' },
        h('div', { class: 'cat-head' },
          h('button', { class: 'hg-head', onclick: () => catForm(c) }, h('span', {}, c),
            h('span', { class: 'muted small' }, `${pend.length} faltam${sum(pend) ? ' · ' + brl(sum(pend)) : ''}`)),
          h('button', { class: 'icon-btn sm', 'aria-label': 'Adicionar em ' + c, onclick: () => itemForm(null, c) }, '+')),
        pend.length ? h('div', { class: 'rows' }, pend.map(it => itemRow(it, pend))) : null,
        doneBlock('shop-done-' + c, 'Comprados', fin.map(it => itemRow(it, fin))));
    }), h('button', { class: 'btn ghost', onclick: () => catForm('') }, '+ Nova categoria'));
  }
  root.replaceChildren(h('div', { class: 'view-shop' }, top, card, body));
}
