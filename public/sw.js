// Offline-Unterstützung: App-Hülle + zuletzt geladene Daten werden gecacht.
// Strategie überall "Netzwerk zuerst": online sieht man immer den neuesten
// Stand (auch direkt nach einem Deploy), nur ohne Netz kommt der Cache.
const CACHE = 'gw5-v3';
const SHELL = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
// Bei schlechtem Empfang nicht ewig auf das Netz warten.
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

// Markiert Antworten aus dem Cache, damit die App "Offline" anzeigen kann.
async function fromCache(request) {
  const cached = await caches.match(request, { ignoreSearch: request.mode === 'navigate' });
  if (!cached) return null;
  const headers = new Headers(cached.headers);
  headers.set('X-From-Cache', '1');
  return new Response(await cached.blob(), { status: cached.status, statusText: cached.statusText, headers });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Schreibende Aktionen und fremde Hosts (Google Fonts) nicht anfassen.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const res = await withTimeout(fetch(req), NETWORK_TIMEOUT_MS);
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req.mode === 'navigate' ? '/' : req, copy));
        }
        return res;
      } catch (err) {
        const cached = await fromCache(req.mode === 'navigate' ? new Request('/') : req);
        if (cached) return cached;
        throw err;
      }
    })()
  );
});
