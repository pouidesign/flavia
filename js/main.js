import { h, openModal, toast } from './ui.js';
import { state, onChange, replaceState, resetState } from './store.js';
import { renderAgenda } from './agenda.js';
import { renderPlan } from './plan.js';
import { renderAreas } from './areas.js';
import { renderNotes } from './notes.js';
import { renderMood } from './mood.js';

const TABS = [
  ['agenda', '📅', 'Agenda', renderAgenda], ['plan', '🎯', 'Planejar', renderPlan], ['areas', '🧭', 'Áreas', renderAreas],
  ['notes', '✍️', 'Notas', renderNotes], ['mood', '🌙', 'Humor', renderMood],
];
let tab = (() => { try { return sessionStorage.getItem('tab'); } catch { return null; } })() || 'agenda';
if (!TABS.some(t => t[0] === tab)) tab = 'agenda';

const main = h('main', { class: 'view', id: 'view' });
const bar = h('nav', { class: 'tabbar', 'aria-label': 'Seções' });

function draw() {
  bar.replaceChildren(...TABS.map(([k, ico, label]) => h('button', { class: 'tab' + (k === tab ? ' on' : ''), 'aria-current': k === tab ? 'page' : null,
    onclick: () => { tab = k; try { sessionStorage.setItem('tab', k); } catch { /* ignora */ } draw(); } }, h('span', { class: 'ico' }, ico), h('span', {}, label))));
  const scrollY = main.dataset.tab === tab ? window.scrollY : 0;
  main.dataset.tab = tab;
  TABS.find(t => t[0] === tab)[3](main);
  window.scrollTo(0, scrollY);
}
onChange(draw);

function settings() {
  const file = h('input', { type: 'file', accept: 'application/json', hidden: true, onchange: async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data.areas || !data.goals) throw new Error('formato');
      if (confirm('Importar vai substituir TODOS os dados atuais. Continuar?')) { replaceState(data); toast('Backup importado.'); }
    } catch { toast('Arquivo inválido.'); }
  } });
  openModal('Dados e backup', h('div', { class: 'menu' },
    h('p', { class: 'muted small' }, 'Seus dados ficam somente neste dispositivo (navegador). Faça backups de vez em quando.'),
    h('button', { class: 'btn', onclick: () => {
      const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })), download: `minha-vida-${new Date().toISOString().slice(0, 10)}.json` });
      a.click(); URL.revokeObjectURL(a.href);
    } }, '⬇️ Exportar backup'),
    h('button', { class: 'btn', onclick: () => file.click() }, '⬆️ Importar backup'),
    h('button', { class: 'btn danger', onclick: () => { if (confirm('Apagar TUDO? Isso não pode ser desfeito.') && confirm('Tem certeza absoluta?')) { resetState(); toast('Tudo apagado.'); } } }, '🗑️ Apagar tudo'),
    file));
}

document.getElementById('app').append(
  h('header', { class: 'topbar' }, h('h1', {}, 'Minha Vida'), h('button', { class: 'icon-btn', 'aria-label': 'Dados e backup', onclick: settings }, '⚙️')),
  main, bar);
draw();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
