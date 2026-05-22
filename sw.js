const swUrl = new URL(self.location.href);
const swVersion = swUrl.searchParams.get("v") || "base";
const CACHE_NAME = `workout-log-${swVersion}`;
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./apple-touch-icon-180.png",
  "./favicon-32.png",
  "./icon-512.png"
];

const APP_SHELL_PATHS = new Set([
  "/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/manifest.webmanifest"
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const cacheKey = getCacheKey(event.request);

  if (isAppShellRequest(requestUrl)) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, cloned));
          return response;
        })
        .catch(() => caches.match(cacheKey).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(cacheKey).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then((response) => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, cloned));
        return response;
      });
    })
  );
});

function isAppShellRequest(url) {
  if (url.origin !== self.location.origin) {
    return false;
  }
  const pathname = url.pathname || "/";
  if (APP_SHELL_PATHS.has(pathname)) {
    return true;
  }
  if (pathname.endsWith("/")) {
    return true;
  }
  return false;
}

function getCacheKey(request) {
  const url = new URL(request.url);
  if (!isAppShellRequest(url)) {
    return request;
  }
  const normalized = `${url.origin}${url.pathname}`;
  return new Request(normalized, { method: "GET" });
}
