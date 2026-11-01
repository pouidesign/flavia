import { h, svg, openModal, toast } from './ui.js';
import { state, onChange, replaceState, resetState } from './store.js';
import { renderAgenda } from './agenda.js';
import { renderPlan } from './plan.js';
import { renderAreas } from './areas.js';
import { renderNotes } from './notes.js';
import { renderMood } from './mood.js';

const TABS = [
  ['agenda', 'agenda', 'Agenda', renderAgenda], ['plan', 'plan', 'Planejar', renderPlan], ['areas', 'areas', 'Áreas', renderAreas],
  ['notes', 'notes', 'Notas', renderNotes], ['mood', 'mood', 'Humor', renderMood],
];
/* Ícones de traço no estilo SF Symbols (grade 24) */
const ICONS = {
  agenda: () => [svg('rect', { class: 'fl', x: 3.5, y: 5, width: 17, height: 15.5, rx: 3.5 }), svg('path', { d: 'M3.5 10h17M8 3v4M16 3v4' })],
  plan: () => [svg('circle', { cx: 12, cy: 12, r: 8.5 }), svg('circle', { cx: 12, cy: 12, r: 4.5, class: 'fl' }), svg('circle', { cx: 12, cy: 12, r: .8 })],
  areas: () => [svg('circle', { cx: 12, cy: 12, r: 8.5 }), svg('path', { class: 'fl', d: 'M15.8 8.2l-2 5.6-5.6 2 2-5.6z' })],
  notes: () => [svg('path', { d: 'M11 4H7.5A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5V13' }), svg('path', { class: 'fl', d: 'M18.2 3.6l2.2 2.2-8.2 8.2-3 .8.8-3z' })],
  mood: () => [svg('path', { class: 'fl', d: 'M20 14.2A8.3 8.3 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2z' })],
};
const icon = k => svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, ICONS[k]());

/* Tamanho do texto (Dynamic Type manual) */
const SIZES = [['.9', 'Pequeno'], ['1', 'Padrão'], ['1.15', 'Grande'], ['1.3', 'Maior']];
const getDt = () => { try { return localStorage.getItem('flavia.dt') || '1'; } catch { return '1'; } };
const setDt = v => { document.documentElement.style.setProperty('--dt', v); try { localStorage.setItem('flavia.dt', v); } catch { /* ignora */ } };
setDt(getDt());
let tab = (() => { try { return sessionStorage.getItem('tab'); } catch { return null; } })() || 'agenda';
if (!TABS.some(t => t[0] === tab)) tab = 'agenda';

const main = h('main', { class: 'view', id: 'view' });
const bar = h('nav', { class: 'tabbar', 'aria-label': 'Seções' });

function draw() {
  bar.replaceChildren(...TABS.map(([k, ico, label]) => h('button', { class: 'tab' + (k === tab ? ' on' : ''), 'aria-current': k === tab ? 'page' : null,
    onclick: () => { tab = k; try { sessionStorage.setItem('tab', k); } catch { /* ignora */ } draw(); } }, icon(ico), h('span', {}, label))));
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
    h('div', {}, h('p', { class: 'muted small', style: { marginBottom: '8px' } }, 'Tamanho do texto'),
      h('div', { class: 'seg', id: 'dt-seg' }, SIZES.map(([v, l]) => h('button', { class: v === getDt() ? 'on' : '', onclick: e => { setDt(v); e.target.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === e.target)); } }, l)))),
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
