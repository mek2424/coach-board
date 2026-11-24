// Kolo kpwa: service worker Trenérovy tabulky. Při každém kole s novými soubory zvýšit verzi cache.
const CACHE = 'tabulka-v38';
const ZAKLAD = ['./', 'js/kvet.js', 'js/barvy.js', 'js/fa-ikony.json', 'js/vendor/blossom-color-picker.js', 'manifest.webmanifest',
  'ikony/ikona-192.png', 'ikony/ikona-512.png', 'ikony/ikona-512-maskable.png', 'ikony/apple-touch-icon.png'];
self.addEventListener('install', (e) => {
  // co se nepodaří stáhnout, se doplní při prvním použití – instalace kvůli tomu neselže
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ZAKLAD.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // stránka: nejdřív síť (nová verze hned), bez sítě uložená kopie; odkaz pro Trenéra (#t=…) je jen v adrese, stránka je pořád stejná
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then((o) => { if (o.ok) { const k = o.clone(); caches.open(CACHE).then((c) => c.put('./', k)); } return o; })
      .catch(() => caches.match('./').then((x) => x || caches.match(r))));
    return;
  }
  // písma Google: uložená kopie hned, na pozadí obnovit
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then((c) => c.match(r).then((x) => { const s = fetch(r).then((o) => { c.put(r, o.clone()); return o; }).catch(() => x); return x || s; })));
    return;
  }
  // vlastní soubory (skripty, ikony): z cache, jinak ze sítě a uložit
  if (u.origin === location.origin) {
    e.respondWith(caches.match(r).then((x) => x || fetch(r).then((o) => { if (o.ok) { const k = o.clone(); caches.open(CACHE).then((c) => c.put(r, k)); } return o; })));
  }
});
