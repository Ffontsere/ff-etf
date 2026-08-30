const CACHE = "ff-etf-v6";
const CORE = ["./", "./index.html", "./manifest.webmanifest"];
const RUNTIME_HOSTS = ["unpkg.com", "fonts.googleapis.com", "fonts.gstatic.com"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const cacheable = sameOrigin || RUNTIME_HOSTS.includes(url.hostname);
  if (!cacheable) return;
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) {
        fetch(req).then((res) => { if (res && (res.ok || res.type === "opaque")) caches.open(CACHE).then((c) => c.put(req, res.clone())).catch(() => {}); }).catch(() => {});
        return hit;
      }
      return fetch(req).then((res) => {
        if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
        return res;
      }).catch(() => { if (req.mode === "navigate") return caches.match("./index.html"); return new Response("", { status: 504 }); });
    })
  );
});
