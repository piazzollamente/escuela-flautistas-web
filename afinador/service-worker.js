const CACHE_NAME = "afinador-edf-v11";
const FILES = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.json",
  "icon.svg",
  "service-worker.js"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response.ok || url.search) return response;

        const copy = response.clone();
        event.waitUntil(
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, copy))
            .catch((error) => console.warn("No se pudo actualizar el caché del afinador:", error))
        );
        return response;
      })
      .catch(() => caches.match(event.request))
      .then((response) => response || Response.error())
  );
});
