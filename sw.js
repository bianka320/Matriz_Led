const CACHE_NAME = 'matrixmind-ai-v6.11-hypergeometric';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css?v=6.11',
  './app.js?v=6.11',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Outfit:wght@400;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Almacenando en caché archivos estáticos de MatrixMind PWA...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🧹 Limpiando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de peticiones de red (Estrategia: Network First con fallback a Cache)
self.addEventListener('fetch', (event) => {
  // Omitir intercepción para peticiones hacia el ESP32 o API locales que cambian dinámicamente
  if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clonamos y guardamos en caché para futuro uso offline
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Si estamos sin conexión o falla la red, servimos desde caché
        return caches.match(event.request);
      })
  );
});
