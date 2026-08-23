const CACHE = "hormozi-said-v3";
const APP_SHELL = ["/", "/discover", "/saved", "/install", "/more", "/offline", "/catalog.v1.json", "/icons/icon.svg", "/icons/icon-maskable.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

async function cacheResponse(cache, url) {
  try {
    const response = await fetch(url, { cache: "reload" });
    if (!response.ok) return null;
    await cache.put(url, response.clone());
    return response;
  } catch {
    return null;
  }
}

async function precacheApp() {
  const cache = await caches.open(CACHE);
  const responses = await Promise.all(APP_SHELL.map((url) => cacheResponse(cache, url)));
  const assets = new Set();

  for (const response of responses) {
    if (!response?.headers.get("content-type")?.includes("text/html")) continue;
    const html = await response.text();
    for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
      const url = new URL(match[1], self.location.origin);
      if (url.origin === self.location.origin && url.pathname.startsWith("/_next/")) assets.add(url.href);
    }
  }

  await Promise.all([...assets].map((url) => cacheResponse(cache, url)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheApp().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match("/")) || caches.match("/offline")));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => {
    const network = fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => cached);
    return cached || network;
  }));
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(self.registration.showNotification(payload.title || "Hormozi Said", {
    body: payload.body,
    icon: payload.icon || "/icons/icon.svg",
    badge: "/icons/icon.svg",
    data: { url: payload.url, quoteID: payload.quoteID },
    tag: payload.quoteID ? `daily-quote-${payload.quoteID}` : "daily-quote"
  }));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "SHOW_TEST_NOTIFICATION") return;
  const payload = event.data.payload;
  event.waitUntil(self.registration.showNotification(payload.title, { body: payload.body, icon: payload.icon, data: { url: payload.url, quoteID: payload.quoteID } }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
    for (const client of clients) {
      if ("navigate" in client) await client.navigate(target);
      if ("focus" in client) return client.focus();
    }
    return self.clients.openWindow(target);
  }));
});
