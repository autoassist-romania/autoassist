// sw-cache.js — Service Worker minimal, DOAR pentru cache de fișiere statice (network-first).
// Nu conține deloc logică de business (asta a fost problema versiunii vechi sw.js — trebuia
// să rămână doar cache, restul e în core.js și fișierele JS dedicate).
//
// Strategie: network-first. Încearcă mereu rețeaua întâi, ca update-urile să se vadă instant
// după deploy (exact problema care a dus la dezactivarea SW-ului vechi). Cache-ul e folosit
// DOAR ca variantă de rezervă, când nu există conexiune (offline).
// Nu interceptează request-uri către alte origini (Supabase, API-uri externe) — doar fișierele
// proprii, same-origin, ca să nu strice autentificarea sau datele live.

const CACHE = 'autoassist-v11';
const STATIC = [
  '/',
  '/style.css',
  '/core.js',
  '/rca-itp.js',
  '/vanzare-cv.js',
  '/asistent.js',
  '/documente.js',
  '/mentenanta.js',
  '/piese.js',
  '/ev-vocal-init.js',
  '/flota.js',
  '/push.js',
  '/manifest.json',
  '/icon-32.png',
  '/icon-192.png',
  '/icon-180.png',
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


// ── Notificări push (alerte de expirare documente) ──
// Payload JSON trimis de funcția send-reminders: { title, body, url, tag }
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  const title = d.title || 'AutoAssist';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    icon: '/icon-192.png',
    badge: '/icon-32.png',
    tag: d.tag || 'aa-alert',
    renotify: true,
    data: { url: d.url || '/' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) { c.navigate && c.navigate(target); return c.focus(); }
      }
      return self.clients.openWindow(target);
    })
  );
});
