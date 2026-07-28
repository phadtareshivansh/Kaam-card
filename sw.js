const CACHE_NAME = "kaam-card-v6";
const OFFLINE_CACHE = "kaam-card-offline-v5";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/schemes_db.json",
  "/favicon.svg",
  "/logo.svg",
  "/m.svg",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
];

const JS_ASSETS = [
  "/app.js",
  "/api.js",
  "/csv-parsers.js",
  "/pdf-parser.js",
  "/tests.js"
];

const CACHE_STRATEGIES = {
  static: "cache-first",
  api: "network-first",
  images: "cache-first"
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== OFFLINE_CACHE).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    // For CDN resources, use cache-first
    if (url.hostname === "cdnjs.cloudflare.com") {
      event.respondWith(cacheFirst(request));
      return;
    }
    return;
  }

  // Handle different strategies based on path
  if (request.method !== "GET") {
    return;
  }

  // API requests - network first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // JS assets - network first (never cache so changes reflect immediately)
  if (JS_ASSETS.some(asset => url.pathname.endsWith(asset.replace("/", "")))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets - cache first
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset.replace("/", "")))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/index.html");
    }
    throw error;
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/index.html");
    }
    throw error;
  }
}

// Background sync for pending uploads
self.addEventListener("sync", (event) => {
  if (event.tag === "process-upload-queue") {
    event.waitUntil(processUploadQueue());
  }
});

async function processUploadQueue() {
  // This would communicate with the main thread to process queued uploads
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: "PROCESS_UPLOAD_QUEUE" });
  });
}

// Periodic background sync (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "scheme-eligibility-check") {
    event.waitUntil(checkSchemeEligibility());
  }
});

async function checkSchemeEligibility() {
  // Notify clients to re-check scheme eligibility
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: "RECHECK_SCHEMES" });
  });
}

// Push notification handling
self.addEventListener("push", (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || "New update available",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/"
    },
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || "Kaam Card", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  if (event.action === "open" || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || "/")
    );
  }
});
