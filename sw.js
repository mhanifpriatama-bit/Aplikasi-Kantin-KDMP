// Service Worker untuk Kantin KDMP Sinduadi (Offline Cache PWA - Network First)
const CACHE_NAME = 'kdmp-kasir-v21';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/icons.js',
  './js/cipher.js',
  './js/db.js',
  './js/pdf.js',
  './js/state.js',
  './js/pwa.js',
  './js/views.js',
  './js/events.js',
  './js/app.js',
  './manifest.json',
  './ikonmaskabel.svg',
  './icon.svg',
  './favicon.ico',
  './apple-touch-icon.png',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './pwa-maskable-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Cache partial failure on install:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Menghapus cache lama:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Strategi Network-First: Selalu ambil versi terbaru dari server jika online, simpan ke cache, fallback cache jika offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  // Jangan intersep request internal Vite development, dev server, atau ekstensi browser
  if (
    !url.startsWith('http://') && !url.startsWith('https://') ||
    url.includes('/@vite/') ||
    url.includes('/@fs/') ||
    url.includes('/@id/') ||
    url.includes('hot-update')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          }).catch(() => {});
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return null;
        });
      })
  );
});
