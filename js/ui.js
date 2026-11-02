import { icon } from './icons.js';

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [p, val] of Object.entries(v)) {
        if (val == null) continue;
        p.startsWith('--') ? el.style.setProperty(p, val) : (el.style[p] = val);
      }
    } else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && !k.includes('-')) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(c));
  }
  return el;
}

const NS = 'http://www.w3.org/2000/svg';
export function svg(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(c));
  }
  return el;
}

export function toast(msg) {
  const t = h('div', { class: 'toast' }, msg);
  document.body.append(t);
  setTimeout(() => t.classList.add('out'), 2200);
  setTimeout(() => t.remove(), 2600);
}

export function openModal(title, body) {
  const close = () => { overlay.remove(); document.removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  const overlay = h('div', { class: 'overlay', onclick: e => { if (e.target === overlay) close(); } },
    h('div', { class: 'sheet', role: 'dialog', 'aria-label': title },
      h('div', { class: 'sheet-head' }, h('h3', {}, title),
        h('button', { class: 'icon-btn', 'aria-label': 'Fechar', onclick: close }, icon('close', 22))),
      h('div', { class: 'sheet-body' }, body)));
  document.body.append(overlay);
  document.addEventListener('keydown', esc);
  setTimeout(() => overlay.querySelector('input:not([type=checkbox]),textarea,select')?.focus(), 40);
  return close;
}

/** Confirmação própria (o visualizador de artefatos bloqueia confirm()). */
export function ask(message, okLabel = 'Excluir') {
  return new Promise(resolve => {
    let done = false, close = () => {};
    const finish = v => { if (done) return; done = true; close(); resolve(v); };
    close = openModal('Confirmar', h('div', { class: 'form' }, h('p', {}, message),
      h('div', { class: 'form-foot' }, h('span', { class: 'grow' }),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => finish(false) }, 'Cancelar'),
        h('button', { type: 'button', class: 'btn danger', onclick: () => finish(true) }, okLabel))));
  });
}

export function sheet(title, options) {
  const close = openModal(title, h('div', { class: 'menu' },
    options.map(o => h('button', { class: 'btn menu-item', onclick: () => { close(); o.fn(); } }, o.label))));
}

/** "2,5" "2.5" "1.500,75" → número; vazio → null; inválido → NaN. */
export function parseNum(raw) {
  const t = String(raw).trim().replace(/\s/g, '');
  if (!t) return null;
  const norm = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  return /^-?\d+(\.\d+)?$/.test(norm) ? Number(norm) : NaN;
}

const DAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function openForm({ title, fields, values = {}, submit = 'Salvar', onSubmit, onDelete, hint }) {
  const getters = {}, errEls = {};
  const form = h('form', { class: 'form', novalidate: true });
  if (hint) form.append(h('p', { class: 'hint' }, hint));

  for (const f of fields) {
    const v = values[f.name] ?? f.default ?? (f.type === 'days' ? [] : '');
    let input;
    if (f.type === 'textarea') {
      input = h('textarea', { rows: f.rows || 3, placeholder: f.placeholder || '', value: v });
      getters[f.name] = () => input.value.trim();
    } else if (f.type === 'select') {
      input = h('select', {}, f.options.map(o => h('option', { value: o.v, selected: String(o.v) === String(v) }, o.l)));
      getters[f.name] = () => input.value;
    } else if (f.type === 'checkbox') {
      input = h('input', { type: 'checkbox', checked: !!v });
      getters[f.name] = () => input.checked;
    } else if (f.type === 'days') {
      const sel = new Set(v);
      input = h('div', { class: 'days' }, DAY_LETTERS.map((l, i) => {
        const b = h('button', { type: 'button', class: 'day' + (sel.has(i) ? ' on' : ''), 'aria-label': ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][i],
          onclick: () => { sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('on'); } }, l);
        return b;
      }));
      getters[f.name] = () => [...sel].sort();
    } else if (f.type === 'icons') {
      let cur = v || f.options[0];
      input = h('div', { class: 'icon-pick' }, f.options.map(n => {
        const b = h('button', { type: 'button', class: 'ip' + (n === cur ? ' on' : ''), 'aria-label': n,
          onclick: () => { cur = n; input.querySelectorAll('.ip').forEach(x => x.classList.toggle('on', x === b)); } }, icon(n, 22));
        return b;
      }));
      getters[f.name] = () => cur;
    } else if (f.type === 'swatches') {
      let cur = v || f.options[0];
      input = h('div', { class: 'swatches' }, f.options.map(c => {
        const b = h('button', { type: 'button', class: 'sw' + (c === cur ? ' on' : ''), style: { background: c }, 'aria-label': c,
          onclick: () => { cur = c; input.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === b)); } });
        return b;
      }));
      getters[f.name] = () => cur;
    } else {
      const num = f.type === 'number';
      input = h('input', { type: num ? 'text' : (f.type || 'text'), value: num && v !== '' ? String(v).replace('.', ',') : v, placeholder: f.placeholder || '', inputmode: num ? 'decimal' : null, autocomplete: num ? 'off' : null, maxLength: f.max || null });
      getters[f.name] = () => num ? parseNum(input.value) : input.value.trim();
    }
    const err = h('small', { class: 'err' });
    errEls[f.name] = err;
    form.append(h('label', { class: 'field' + (f.type === 'checkbox' ? ' inline' : '') },
      h('span', { class: 'lbl' }, f.label, f.required ? ' *' : ''), input, err));
  }

  const close = openModal(title, form);
  const footErr = h('p', { class: 'err foot-err', role: 'alert' });
  form.append(h('div', { class: 'form-foot' }, footErr,
    onDelete && h('button', { type: 'button', class: 'btn danger', onclick: async () => { if (await ask('Excluir? Isso não pode ser desfeito.')) { close(); onDelete(); } } }, 'Excluir'),
    h('span', { class: 'grow' }),
    h('button', { type: 'button', class: 'btn ghost', onclick: close }, 'Cancelar'),
    h('button', { type: 'submit', class: 'btn primary' }, submit)));


  form.addEventListener('submit', e => {
    e.preventDefault();
    const vals = {};
    for (const f of fields) vals[f.name] = getters[f.name]();
    let ok = true, first = null;
    for (const f of fields) {
      const val = vals[f.name];
      const bad = typeof val === 'number' && isNaN(val);
      const empty = val === '' || val == null || (Array.isArray(val) && !val.length);
      let msg = '';
      if (bad) msg = 'Digite apenas números (ex.: 12,5)';
      else if (f.required && empty) msg = 'Obrigatório';
      else if (!empty && f.validate) msg = f.validate(val, vals) || '';
      errEls[f.name].textContent = msg;
      errEls[f.name].closest('.field').classList.toggle('has-err', !!msg);
      if (msg) { ok = false; first = first || errEls[f.name]; }
    }
    footErr.textContent = ok ? '' : 'Revise os campos em vermelho.';
    if (!ok) { first.closest('.field').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    close();
    onSubmit(vals);
  });
}
