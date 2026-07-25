const CACHE_NAME = 'zarimap-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/icons/apple-touch-icon.png'
  '/ja/index.html',
  '/en/index.html',
  '/assets/css/style.css',
  '/assets/js/map-logic.js',
  '/assets/data/zarigani.csv',
];

// インストール処理
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// リクエストのフェッチ（キャッシュがあればキャッシュから返し、なければネットワークへ）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
