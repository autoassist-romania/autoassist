// sw-cache.js — Service Worker minimal, DOAR pentru cache de fișiere statice (network-first).
// Nu conține deloc logică de business (asta a fost problema versiunii vechi sw.js — trebuia
// să rămână doar cache, restul e în core.js și fișierele JS dedicate).
//
// Strategie: network-first. Încearcă mereu rețeaua întâi, ca update-urile să se vadă instant
// după deploy (exact problema care a dus la dezactivarea SW-ului vechi). Cache-ul e folosit
// DOAR ca variantă de rezervă, când nu există conexiune (offline).
// Nu interceptează request-uri către alte origini (Supabase, API-uri externe) — doar fișierele
// proprii, same-origin, ca să nu strice autentificarea sau datele live.

const CACHE = 'autoassist-v2';
const STATIC = [
  '/app.html',
  '/style.css',
  '/core.js',
  '/rca-itp.js',
  '/vanzare-cv.js',
  '/asistent.js',
  '/documente.js',
  '/mentenanta.js',
  '/piese.js',
  '/ev-vocal-init.js',
  '/manifest.json',
  '/icon32.png',
  '/icon192.png',
  '/icon180.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .catch(err => console.error('SW install — nu am putut popula cache-ul inițial:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Doar GET, doar same-origin — nu atingem Supabase, API-uri externe, POST-uri etc.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
