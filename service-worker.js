// Service Worker для SportTime PWA
// Минимальная версия — для возможности установки на телефон

const CACHE_NAME = 'sporttime-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Установка SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Кэш открыт');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Ошибка кэширования:', err);
      })
  );
  self.skipWaiting();
});

// Активация SW
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов (стратегия: сеть с фолбэком на кэш)
self.addEventListener('fetch', (event) => {
  // Пропускаем запросы к Dropbox и другим внешним API
  if (event.request.url.includes('dropbox.com') || 
      event.request.url.includes('dropboxapi.com') ||
      event.request.url.includes('ajax.googleapis.com') ||
      event.request.url.includes('cdnjs.cloudflare.com') ||
      event.request.url.includes('cdn.jsdelivr.net') ||
      event.request.url.includes('unpkg.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Клонируем ответ для кэша
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Если сеть недоступна — пробуем кэш
        return caches.match(event.request)
          .then((response) => {
            return response || new Response('Офлайн-режим не поддерживается', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
