// Saniona Investor service worker: network first, cache only as offline fallback.
// v4: pages and data are always fetched past the browser cache, so an installed app shows the latest version.
const CACHE = 'saniona-investor-v4';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  const fresh = req.mode === 'navigate' || /\.(html|ics|webmanifest|xml)$|\/$/.test(new URL(req.url).pathname);
  e.respondWith(
    fetch(fresh ? new Request(req, { cache: 'no-store' }) : req)
      .then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('/') : undefined)))
  );
});
