const CACHE_NAME = 'cpf-coaching-v1';
const urlsToCache = [
  '/',
  '/css/webslides.css',
  '/css/svg-icons.css',
  '/js/webslides.js',
  '/js/svg-icons.js',
  '/static/images/logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});