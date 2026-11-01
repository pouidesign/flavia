import { h } from './ui.js';
import { icon } from './icons.js';
import { state, commit, save, uid } from './store.js';
import { today, addDays, fmtLong, fmtBR } from './dates.js';
import { MOODS } from './mood.js';
import { face } from './icons.js';
import { openBoard } from './canvas.js';
import { openForm } from './ui.js';

let sub = 'notes', editing = null, query = '', jDate = today(), host;

export function renderNotes(root) {
  host = root;
  const tabs = [['notes', 'notes', 'Notas'], ['journal', 'book', 'Journal'], ['canvas', 'palette', 'Canvas']];
  root.replaceChildren(
    h('div', { class: 'subtabs' }, tabs.map(([k, ic, l]) => h('button', { class: k === sub ? 'on' : '', onclick: () => { sub = k; editing = null; renderNotes(root); } }, icon(ic), ' ', l))),
    sub === 'notes' ? (editing ? editor() : list()) : sub === 'journal' ? journal() : canvasList());
}

function list() {
  const q = query.toLowerCase();
  const notes = state.notes.filter(n => !q || (n.title + ' ' + n.body).toLowerCase().includes(q))
    .sort((a, b) => (b.pinned - a.pinned) || b.updated - a.updated);
  return h('div', {},
    h('div', { class: 'view-head' },
      h('input', { class: 'search', type: 'search', placeholder: 'Buscar notas…', value: query, oninput: e => { query = e.target.value; const pos = e.target.selectionStart; renderNotes(host); const i = host.querySelector('.search'); i.focus(); i.setSelectionRange(pos, pos); } }),
      h('button', { class: 'btn primary', onclick: () => { const n = { id: uid(), title: '', body: '', pinned: false, updated: Date.now() }; state.notes.push(n); editing = n.id; save(); renderNotes(host); } }, '+ Nova nota')),
    notes.length ? h('div', { class: 'notes-grid' }, notes.map(n => h('article', { class: 'card note-card', onclick: () => { editing = n.id; renderNotes(host); } },
      h('h3', {}, n.pinned && icon('pin'), n.pinned && ' ', n.title || 'Sem título'),
      h('p', {}, (n.body || '').slice(0, 160) || '…'),
      h('small', { class: 'muted' }, new Date(n.updated).toLocaleDateString('pt-BR'))))) : h('p', { class: 'empty' }, 'Nenhuma nota. Comece escrevendo algo livre.'));
}

function editor() {
  const n = state.notes.find(x => x.id === editing);
  if (!n) { editing = null; return list(); }
  const touch = () => { n.updated = Date.now(); save(); };
  const back = () => {
    if (!n.title.trim() && !n.body.trim()) state.notes = state.notes.filter(x => x !== n);
    editing = null; commit();
  };
  return h('div', { class: 'editor' },
    h('div', { class: 'area-head' },
      h('button', { class: 'btn ghost', onclick: back }, [icon('back'), ' Notas']),
      h('span', { class: 'grow' }),
      h('button', { class: 'btn ghost', onclick: e => { n.pinned = !n.pinned; touch(); e.currentTarget.textContent = n.pinned ? 'Fixada' : 'Fixar'; } }, n.pinned ? 'Fixada' : 'Fixar'),
      h('button', { class: 'btn danger', onclick: () => { if (confirm('Excluir esta nota?')) { state.notes = state.notes.filter(x => x !== n); editing = null; commit(); } } }, 'Excluir')),
    h('input', { class: 'note-title', placeholder: 'Título', value: n.title, oninput: e => { n.title = e.target.value; touch(); } }),
    h('textarea', { class: 'note-body', placeholder: 'Escreva livremente…', value: n.body, oninput: e => { n.body = e.target.value; touch(); } }));
}

function journal() {
  const e = state.journal[jDate] || {};
  const upd = (k, v) => { state.journal[jDate] = { ...(state.journal[jDate] || {}), [k]: v }; save(); };
  const mood = state.moods[jDate] && MOODS.find(m => m.l === state.moods[jDate].level);
  const field = (k, label, ph, rows) => h('label', { class: 'field' }, h('span', { class: 'lbl' }, label), h('textarea', { rows, placeholder: ph, value: e[k] || '', oninput: ev => upd(k, ev.target.value) }));
  const past = Object.entries(state.journal).filter(([d, v]) => d !== jDate && (v.text || v.gratitude || v.learned)).sort((a, b) => a[0] < b[0] ? 1 : -1).slice(0, 14);
  return h('div', { class: 'journal' },
    h('div', { class: 'mood-nav' },
      h('button', { class: 'icon-btn', 'aria-label': 'Dia anterior', onclick: () => { jDate = addDays(jDate, -1); renderNotes(host); } }, '‹'),
      h('h2', {}, fmtLong(jDate), mood && ' ', mood && face(state.moods[jDate].level, 22)),
      h('button', { class: 'icon-btn', 'aria-label': 'Próximo dia', onclick: () => { jDate = addDays(jDate, 1); renderNotes(host); } }, '›'),
      h('button', { class: 'btn ghost sm', onclick: () => { jDate = today(); renderNotes(host); } }, 'Hoje')),
    h('div', { class: 'card' },
      field('text', 'Como foi o dia?', 'Escreva sem filtro…', 7),
      field('gratitude', 'Gratidão', 'Pelo que você é grata hoje?', 3),
      field('learned', 'Aprendi', 'Algo que você levou deste dia', 3)),
    past.length ? h('section', { class: 'sec' }, h('h3', {}, 'Entradas anteriores'),
      h('div', { class: 'rows' }, past.map(([d, v]) => h('div', { class: 'row', onclick: () => { jDate = d; renderNotes(host); } },
        h('div', { class: 'row-main' }, h('div', { class: 'row-title' }, fmtBR(d)), h('div', { class: 'row-meta muted small' }, (v.text || v.gratitude || v.learned).slice(0, 90))))))) : null);
}

const TYPES = { livre: 'Quadro livre', mapa: 'Mapa mental', moodboard: 'Moodboard' };
const TYPE_ICON = { livre: 'palette', mapa: 'mindmap', moodboard: 'grid' };

function canvasList() {
  return h('div', {},
    h('div', { class: 'view-head' }, h('p', { class: 'muted' }, 'Quadros infinitos: notas, texto, desenho à mão, imagens, cores e conexões.'),
      h('button', { class: 'btn primary', onclick: () => newBoard() }, '+ Novo canvas')),
    state.boards.length ? h('div', { class: 'notes-grid' }, state.boards.map(b => h('article', { class: 'card note-card', onclick: () => open(b) },
      h('h3', {}, b.name), h('p', {}, icon(TYPE_ICON[b.type]), ' ', TYPES[b.type]), h('small', { class: 'muted' }, `${b.items.length} item(ns) · ${b.strokes.length} traço(s)`)))) : h('p', { class: 'empty' }, 'Nenhum canvas ainda.'));
}

function newBoard() {
  openForm({
    title: 'Novo canvas',
    fields: [
      { name: 'name', label: 'Nome', required: true, placeholder: 'Ex.: Ideias do projeto' },
      { name: 'type', label: 'Tipo', type: 'select', options: Object.entries(TYPES).map(([v, l]) => ({ v, l })) },
    ],
    onSubmit: v => {
      const b = { id: uid(), name: v.name, type: v.type, items: [], links: [], strokes: [] };
      if (v.type === 'mapa') b.items.push({ id: uid(), type: 'node', x: 1100, y: 800, w: 190, h: 70, color: '#cfe8ff', text: 'Ideia central' });
      state.boards.push(b); save(); open(b);
    },
  });
}

function open(b) { openBoard(host, b, () => { commit(); }); }
