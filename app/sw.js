// TERA service worker: only receives files shared from other apps (Web Share Target, Android/Chrome).
// The files wait in a cache until the page uploads them to the folder the user picks.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'POST' || !u.pathname.endsWith('/share')) return;
  e.respondWith((async () => {
    const files = (await e.request.formData()).getAll('files').filter((f) => f && f.name !== undefined);
    const c = await caches.open('tera-share');
    for (const k of await c.keys()) await c.delete(k); // an older, unfinished share is replaced
    await Promise.all(files.map((f, i) => c.put('./shared/' + i, new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream', 'x-name': encodeURIComponent(f.name), 'x-mtime': String(f.lastModified || Date.now()) } }))));
    return Response.redirect('./?share=' + files.length, 303);
  })());
});
