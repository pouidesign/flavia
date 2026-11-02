const V = 'minha-vida-v11';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/tokens.css', 'css/style.css', 'design-system.html', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/icon-maskable-512.png',
  ...['config', 'sync', 'icons', 'agenda', 'areas', 'canvas', 'components', 'data', 'dates', 'forms', 'home', 'shop', 'main', 'mood', 'moon', 'notes', 'plan', 'store', 'ui'].map(n => `js/${n}.js`)];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;   // nunca guarda respostas da nuvem
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(ch => ch.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
