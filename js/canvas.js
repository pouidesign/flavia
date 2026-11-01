import { h, svg, toast } from './ui.js';
import { state, save, uid } from './store.js';
import { icon } from './icons.js';

const W = 2600, H = 1800;
const NOTE_COLORS = ['#fff2a8', '#ffd3dc', '#cfe8ff', '#d6f5d6', '#e6d9ff', '#ffe0c2'];
const PENS = ['var(--label)', 'var(--sys-red)', 'var(--sys-blue)', 'var(--sys-green)', 'var(--sys-orange)'];

export function openBoard(root, board, back) {
  let tool = 'move', sel = null, linkFrom = null, pen = PENS[0], penW = 3;
  const els = new Map();

  const linksSvg = svg('svg', { class: 'cv-svg cv-links', width: W, height: H });
  const strokesSvg = svg('svg', { class: 'cv-svg cv-strokes', width: W, height: H });
  const layer = h('div', { class: 'cv-items' });
  const world = h('div', { class: 'cv-world', style: { width: W + 'px', height: H + 'px' } }, linksSvg, layer, strokesSvg);
  const scroller = h('div', { class: 'cv-scroll' }, world);
  const ctx = h('div', { class: 'cv-ctx' });
  const toolbar = h('div', { class: 'cv-tools' });
  const fileIn = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: e => { const f = e.target.files[0]; if (f) addImage(f); e.target.value = ''; } });

  /* ---------- seleção / ferramentas ---------- */
  function setTool(t) { tool = t; linkFrom = null; select(null); paintTools(); world.dataset.tool = t; }
  function select(s) {
    sel = s;
    els.forEach((el, id) => el.classList.toggle('sel', !!s && s.kind === 'item' && s.id === id));
    drawLinks(); paintCtx();
  }
  function paintTools() {
    const tb = (k, label, title) => h('button', { class: 'tb' + (tool === k ? ' on' : ''), title, 'aria-label': title, onclick: () => setTool(k) }, label);
    const add = (label, title, fn) => h('button', { class: 'tb add', title, 'aria-label': title, onclick: fn }, label);
    toolbar.replaceChildren(
      tb('move', icon('cursor'), 'Mover / editar'), tb('draw', icon('pencil'), 'Desenhar'), tb('erase', icon('eraser'), 'Borracha'), tb('link', icon('link'), 'Ligar itens'),
      h('span', { class: 'tb-sep' }),
      add([icon('note'), ' Nota'], 'Nova nota', () => addItem({ type: 'note', w: 190, h: 150, color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)], text: 'Nota' })),
      add([icon('text'), ' Texto'], 'Novo texto', () => addItem({ type: 'text', w: 240, h: 60, color: 'transparent', text: 'Texto' })),
      add([icon('node'), ' Nó'], 'Novo nó de mapa', () => addItem({ type: 'node', w: 170, h: 64, color: '#cfe8ff', text: 'Ideia' })),
      add([icon('image'), ' Imagem'], 'Adicionar imagem', () => fileIn.click()),
      add([icon('drop'), ' Cor'], 'Amostra de cor', () => addItem({ type: 'color', w: 120, h: 120, color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0') })));
    if (tool === 'draw') toolbar.append(h('span', { class: 'tb-sep' }), ...PENS.map(c => h('button', { class: 'pen' + (c === pen ? ' on' : ''), style: { background: c }, 'aria-label': 'Cor ' + c, onclick: () => { pen = c; paintTools(); } })),
      h('select', { class: 'select tiny', 'aria-label': 'Espessura', onchange: e => { penW = +e.target.value; } }, [2, 3, 6, 10].map(w => h('option', { value: w, selected: w === penW }, w + 'px'))));
    if (tool === 'link') toolbar.append(h('span', { class: 'cv-hint' }, 'Toque em dois itens para ligá-los'));
  }
  function paintCtx() {
    ctx.replaceChildren();
    if (!sel) return;
    if (sel.kind === 'link') { ctx.append(h('button', { class: 'btn sm danger', onclick: delSel }, 'Excluir ligação')); return; }
    const it = board.items.find(i => i.id === sel.id); if (!it) return;
    if (it.type === 'note' || it.type === 'node' || it.type === 'text') {
      ctx.append(...NOTE_COLORS.map(c => h('button', { class: 'sw', style: { background: c }, 'aria-label': c, onclick: () => { it.color = c; els.get(it.id).style.background = c; save(); } })));
    }
    if (it.type === 'color') ctx.append(h('input', { type: 'color', value: it.color, 'aria-label': 'Escolher cor', oninput: e => { it.color = e.target.value; const el = els.get(it.id); el.style.background = it.color; el.querySelector('.cv-hex').textContent = it.color; save(); } }));
    if (it.type === 'node' || it.type === 'note') ctx.append(h('button', { class: 'btn sm', onclick: () => addChild(it) }, '＋ Filho'));
    ctx.append(h('button', { class: 'btn sm danger', onclick: delSel }, 'Excluir'));
  }
  function delSel() {
    if (!sel) return;
    if (sel.kind === 'item') {
      board.items = board.items.filter(i => i.id !== sel.id);
      board.links = board.links.filter(l => l.from !== sel.id && l.to !== sel.id);
      els.get(sel.id)?.remove(); els.delete(sel.id);
    } else board.links = board.links.filter(l => l.id !== sel.id);
    sel = null; save(); drawLinks(); paintCtx();
  }

  /* ---------- itens ---------- */
  function center() { return { x: scroller.scrollLeft + scroller.clientWidth / 2, y: scroller.scrollTop + scroller.clientHeight / 2 }; }
  function addItem(base, at) {
    const c = at || center(), j = () => (Math.random() - .5) * 60;
    const it = { id: uid(), x: Math.max(0, Math.round(c.x - base.w / 2 + j())), y: Math.max(0, Math.round(c.y - base.h / 2 + j())), ...base };
    board.items.push(it); mount(it); save(); setTool('move'); select({ kind: 'item', id: it.id });
    return it;
  }
  function addChild(p) {
    const c = addItem({ type: p.type, w: p.w, h: p.h, color: p.color, text: 'Ideia' }, { x: p.x + p.w + 110 + p.w / 2, y: p.y + p.h / 2 + (Math.random() - .5) * 160 });
    board.links.push({ id: uid(), from: p.id, to: c.id }); save(); drawLinks();
  }
  function addImage(file) {
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 900 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        const w = Math.min(280, cv.width), hh = Math.round(w * cv.height / cv.width);
        addItem({ type: 'image', w, h: hh, src: cv.toDataURL('image/jpeg', 0.82) });
      };
      img.onerror = () => toast('Não consegui abrir essa imagem.');
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  }

  function mount(it) {
    const el = h('div', { class: `cv-item t-${it.type}`, 'data-id': it.id, style: { left: it.x + 'px', top: it.y + 'px', width: it.w + 'px', height: it.h + 'px', background: it.type === 'image' ? null : it.color } });
    if (it.type === 'image') el.append(h('img', { src: it.src, draggable: false, alt: '' }));
    else if (it.type === 'color') el.append(h('span', { class: 'cv-hex' }, it.color));
    else {
      const tx = h('div', { class: 'cv-text', contenteditable: 'false', spellcheck: 'false' }, it.text);
      tx.addEventListener('blur', () => { tx.contentEditable = 'false'; it.text = tx.innerText; save(); });
      el.addEventListener('dblclick', () => { if (tool !== 'move') return; tx.contentEditable = 'true'; tx.focus(); document.getSelection().selectAllChildren(tx); });
      el.append(tx);
    }
    el.append(h('span', { class: 'cv-resize' }));
    el.addEventListener('pointerdown', e => onDown(e, it, el));
    layer.append(el); els.set(it.id, el);
  }

  function onDown(e, it, el) {
    if (tool === 'link') {
      e.preventDefault();
      if (!linkFrom) { linkFrom = it.id; el.classList.add('link-src'); }
      else {
        if (linkFrom !== it.id && !board.links.some(l => (l.from === linkFrom && l.to === it.id) || (l.from === it.id && l.to === linkFrom))) {
          board.links.push({ id: uid(), from: linkFrom, to: it.id }); save();
        }
        els.get(linkFrom)?.classList.remove('link-src'); linkFrom = null; drawLinks();
      }
      return;
    }
    if (tool !== 'move' || el.querySelector('[contenteditable=true]')) return;
    select({ kind: 'item', id: it.id });
    const resizing = e.target.classList.contains('cv-resize');
    const sx = e.clientX, sy = e.clientY, ox = it.x, oy = it.y, ow = it.w, oh = it.h;
    let moved = false;
    el.setPointerCapture(e.pointerId);
    const mv = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      if (resizing) { it.w = Math.max(70, Math.round(ow + dx)); it.h = Math.max(44, Math.round(oh + dy)); el.style.width = it.w + 'px'; el.style.height = it.h + 'px'; }
      else { it.x = Math.max(0, Math.min(W - 40, Math.round(ox + dx))); it.y = Math.max(0, Math.min(H - 40, Math.round(oy + dy))); el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; }
      drawLinks();
    };
    const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); if (moved) save(); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }

  /* ---------- ligações ---------- */
  function drawLinks() {
    linksSvg.replaceChildren();
    for (const l of board.links) {
      const a = board.items.find(i => i.id === l.from), b = board.items.find(i => i.id === l.to);
      if (!a || !b) continue;
      const p = { x1: a.x + a.w / 2, y1: a.y + a.h / 2, x2: b.x + b.w / 2, y2: b.y + b.h / 2 };
      const on = sel && sel.kind === 'link' && sel.id === l.id;
      linksSvg.append(svg('line', { ...p, class: 'link' + (on ? ' on' : '') }),
        svg('line', { ...p, class: 'hit', onclick: () => { if (tool === 'move') select({ kind: 'link', id: l.id }); } }));
    }
  }

  /* ---------- desenho ---------- */
  const pathD = pts => {
    if (pts.length === 1) return `M${pts[0][0]} ${pts[0][1]}l0.01 0`;
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) d += `Q${pts[i][0]} ${pts[i][1]} ${(pts[i][0] + pts[i + 1][0]) / 2} ${(pts[i][1] + pts[i + 1][1]) / 2}`;
    const l = pts[pts.length - 1]; return d + `L${l[0]} ${l[1]}`;
  };
  const strokeEl = s => svg('path', { d: pathD(s.pts), stroke: s.color, 'stroke-width': s.w, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'data-sid': s.id });
  const drawStrokes = () => strokesSvg.replaceChildren(...board.strokes.map(strokeEl));
  const pos = e => { const r = world.getBoundingClientRect(); return [Math.round(e.clientX - r.left), Math.round(e.clientY - r.top)]; };
  let cur = null, curEl = null, erasing = false;
  strokesSvg.addEventListener('pointerdown', e => {
    if (tool === 'draw') {
      strokesSvg.setPointerCapture(e.pointerId);
      cur = { id: uid(), color: pen, w: penW, pts: [pos(e)] }; curEl = strokeEl(cur); strokesSvg.append(curEl);
    } else if (tool === 'erase') { erasing = true; strokesSvg.setPointerCapture(e.pointerId); eraseAt(e); }
  });
  strokesSvg.addEventListener('pointermove', e => {
    if (cur) { const p = pos(e), l = cur.pts[cur.pts.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 1.5) { cur.pts.push(p); curEl.setAttribute('d', pathD(cur.pts)); } }
    else if (erasing) eraseAt(e);
  });
  const endDraw = () => { if (cur) { board.strokes.push(cur); save(); } cur = null; curEl = null; erasing = false; };
  strokesSvg.addEventListener('pointerup', endDraw); strokesSvg.addEventListener('pointercancel', endDraw);
  function eraseAt(e) {
    const t = document.elementsFromPoint(e.clientX, e.clientY).find(n => n.dataset?.sid);
    if (t) { board.strokes = board.strokes.filter(s => s.id !== t.dataset.sid); t.remove(); save(); }
  }

  /* ---------- montagem ---------- */
  const onKey = e => {
    if (e.target.matches('input,textarea,select,[contenteditable=true]')) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); delSel(); }
    if (e.key === 'Escape') setTool('move');
  };
  document.addEventListener('keydown', onKey);
  const leave = () => { document.removeEventListener('keydown', onKey); back(); };

  root.replaceChildren(h('div', { class: 'canvas-view' },
    h('div', { class: 'cv-top' },
      h('button', { class: 'btn ghost', onclick: leave }, [icon('back'), ' Canvas']),
      h('input', { class: 'cv-name', value: board.name, 'aria-label': 'Nome do canvas', oninput: e => { board.name = e.target.value || 'Sem nome'; save(); } }),
      h('button', { class: 'btn danger sm', onclick: () => { if (confirm('Excluir este canvas?')) { state.boards = state.boards.filter(b => b !== board); leave(); } } }, 'Excluir')),
    toolbar, ctx, scroller, fileIn));

  board.items.forEach(mount); drawLinks(); drawStrokes(); paintTools(); paintCtx();
  const minX = Math.min(...board.items.map(i => i.x), ...board.strokes.flatMap(s => s.pts.map(p => p[0])), 1e9);
  const minY = Math.min(...board.items.map(i => i.y), ...board.strokes.flatMap(s => s.pts.map(p => p[1])), 1e9);
  if (minX < 1e9) requestAnimationFrame(() => { scroller.scrollLeft = Math.max(0, minX - 60); scroller.scrollTop = Math.max(0, minY - 60); });
}
