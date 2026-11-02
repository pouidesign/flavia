/* Ícones de traço (grade 24, estilo SF Symbols). Sem dependências. */
const NS = 'http://www.w3.org/2000/svg';
const D = {
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.5l3 3 5-6"/>',
  repeat: '<path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H18l-2.5-2.5M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H6l2.5 2.5"/>',
  sunrise: '<path d="M3 18.5h18M8 18.5a4 4 0 0 1 8 0M12 5v4M5.6 9.6l1.4 1.4M18.4 9.6L17 11M2.5 14.5h2M19.5 14.5h2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
  moon: '<path d="M20 14.2A8.3 8.3 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
  pin: '<path d="M9 4h6l-1 5 3 3H7l3-3zM12 12v8"/>',
  cake: '<path d="M5 12h14v8H5zM5 16c2 1.5 3.5 1.5 5 0s3-1.5 4 0 3 1.5 5 0M12 8V5"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8z"/>',
  flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .5 1.5 1.5 2 2 2 0-3-1-5 1-8z"/>',
  warning: '<path d="M12 4l9 15.5H3zM12 10v4.5M12 17.2v.01"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  briefcase: '<rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 13h17"/>',
  coins: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.5c-.5-1-4.5-1.3-4.5.8 0 2.2 4.5 1.2 4.5 3.4 0 2-4 1.7-4.7.5M12 7v1.5M12 15.7V17"/>',
  people: '<circle cx="9" cy="9" r="3"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 6a3 3 0 0 1 0 6M17 14.5c2 .5 3.5 2.2 3.5 4.5"/>',
  home: '<path d="M4 11l8-6.5 8 6.5M6 9.5V19h12V9.5M10 19v-5h4v5"/>',
  sparkle: '<path d="M11 3.5l1.8 5.2 5.2 1.8-5.2 1.8L11 17.5l-1.8-5.2L4 10.5l5.2-1.8zM18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  palette: '<path d="M12 4a8 8 0 1 0 0 16c1.2 0 1.8-.8 1.5-1.8-.4-1.3.4-2.2 1.5-2.2h2a3.5 3.5 0 0 0 3.5-3.5A8 8 0 0 0 12 4z"/><circle cx="8" cy="11" r=".8"/><circle cx="11" cy="7.8" r=".8"/><circle cx="15" cy="8.5" r=".8"/>',
  sprout: '<path d="M12 20v-8M12 12c0-3.5-2.5-5.5-6.5-5.5 0 3.5 2.5 5.5 6.5 5.5zM12 14c0-3 2-5 6-5 0 3-2 5-6 5z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  download: '<path d="M12 4v11M7.5 11L12 15.5 16.5 11M5 19.5h14"/>',
  upload: '<path d="M12 15.5V4.5M7.5 9L12 4.5 16.5 9M5 19.5h14"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l.8 12.5h8.4L17 7M10.5 11v5M13.5 11v5"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  cursor: '<path d="M6 4l12 6.5-5 1.5-2 5.5z"/>',
  pencil: '<path d="M16.5 4l3.5 3.5L8.5 19l-4.5 1 1-4.5z"/>',
  eraser: '<path d="M9 19l-4-4 9.5-9.5 5 5L11 19zM14 19h6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  note: '<path d="M5 4.5h14v10l-5 5H5z"/><path d="M14 19.5v-5h5"/>',
  text: '<path d="M5 6.5V5h14v1.5M12 5v14M9.5 19h5"/>',
  node: '<rect x="3.5" y="8" width="17" height="8" rx="4"/>',
  image: '<rect x="3.5" y="5" width="17" height="14" rx="3"/><circle cx="9" cy="10" r="1.5"/><path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4"/>',
  drop: '<path d="M12 3.5c3 4 6 6.7 6 10.2a6 6 0 0 1-12 0C6 10.2 9 7.5 12 3.5z"/>',
  book: '<path d="M6 4h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2zM6 18a2 2 0 0 1 2-2h11M10 8h5"/>',
  notes: '<path d="M11 4H7.5A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5V13"/><path d="M18.2 3.6l2.2 2.2-8.2 8.2-3 .8.8-3z"/>',
  mindmap: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 12L15.5 7M8.5 12l7 5"/>',
  grid: '<rect x="4" y="4" width="7" height="9" rx="1.5"/><rect x="13" y="4" width="7" height="5" rx="1.5"/><rect x="13" y="11" width="7" height="9" rx="1.5"/><rect x="4" y="15" width="7" height="5" rx="1.5"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3.5a5.5 5.5 0 0 0-3 10.2V16h6v-2.3A5.5 5.5 0 0 0 12 3.5z"/>',
  dumbbell: '<path d="M6.5 8v8M17.5 8v8M3.5 10v4M20.5 10v4M6.5 12h11"/>',
  cloud: '<path d="M7.5 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18.4 10 4.2 4.2 0 0 1 17.5 18.5z"/>',
  bag: '<path d="M6 8h12l-1 11.5H7zM9 8V6.5a3 3 0 0 1 6 0V8"/>',
  up: '<path d="M6.5 14.5L12 9l5.5 5.5"/>',
  down: '<path d="M6.5 9.5L12 15l5.5-5.5"/>',
  top: '<path d="M6 5h12M12 19V9M7.5 13.5L12 9l4.5 4.5"/>',
  list: '<path d="M9 7h10M9 12h10M9 17h10M5 7h.01M5 12h.01M5 17h.01"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.8 8.2l-2 5.6-5.6 2 2-5.6z"/>',
};
export const AREA_ICONS = ['heart', 'briefcase', 'coins', 'people', 'home', 'sparkle', 'palette', 'sprout', 'star', 'book', 'dumbbell', 'sun', 'moon', 'bulb', 'target', 'trophy', 'flame', 'compass'];
export const ROUTINE_ICONS = ['sunrise', 'sun', 'moon', 'dumbbell', 'book', 'heart', 'star', 'bulb', 'home', 'briefcase'];
export const ICON_NAMES = Object.keys(D);

/** Cria um <svg> de ícone. `size` em px (opcional; senão usa 1.15em do texto). */
export function icon(name, size) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'i'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = D[name] || D.sparkle;
  if (size) { s.style.width = size + 'px'; s.style.height = size + 'px'; }
  return s;
}

/* Migração de emojis antigos guardados nos dados. */
const OLD = { '💚': 'heart', '💼': 'briefcase', '💰': 'coins', '💞': 'people', '🏡': 'home', '🧘': 'sparkle', '🎨': 'palette', '🌱': 'sprout', '🌅': 'sunrise', '🌙': 'moon', '💪': 'dumbbell', '✨': 'sparkle' };
export const areaIcon = a => (a.icon && D[a.icon]) ? a.icon : (OLD[a.emoji] || 'sparkle');
export const routineIcon = r => (r.icon && D[r.icon]) ? r.icon : (OLD[r.emoji] || 'sunrise');

/** Carinha de humor (nível 1..5), desenhada em traço. */
const MOUTH = {
  1: 'M8 17.2c1.4-2.6 6.6-2.6 8 0', 2: 'M9 16.3c1.2-1.2 4.8-1.2 6 0', 3: 'M9 15.6h6',
  4: 'M9 14.6c1.2 1.4 4.8 1.4 6 0', 5: 'M8 14c.8 3.4 7.2 3.4 8 0z',
};
export function face(level, size) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'i face'); s.setAttribute('aria-hidden', 'true');
  const brows = level === 1 ? '<path d="M7.5 8.6l2.4.9M16.5 8.6l-2.4.9"/>' : '';
  s.innerHTML = `<circle cx="12" cy="12" r="9"/>${brows}<circle cx="9" cy="10.4" r=".7" fill="currentColor"/><circle cx="15" cy="10.4" r=".7" fill="currentColor"/><path d="${MOUTH[level]}"/>`;
  if (size) { s.style.width = size + 'px'; s.style.height = size + 'px'; }
  return s;
}
