const CACHE_NAME = 'zarimap-static-cache';
const TILE_CACHE_NAME = 'zarimap-gsi-tiles-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/ja/index.html',
  '/en/index.html',
  '/manifest.json',
  '/assets/css/style.css',
  '/assets/js/map-logic.js',
  '/assets/data/zarigani.csv',
  '/assets/icons/apple-touch-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];


// 1. インストール時：キャッシュを毎回ネットワークから最新状態で取得
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Force re-installing: fetching fresh assets from network...');
      
      // 各ファイルをブラウザキャッシュ無視(reload)で最新取得して保存
      const fetchPromises = STATIC_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'reload' });
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (err) {
          console.warn('[SW] Failed to fetch fresh asset:', url, err);
        }
      });
      
      return Promise.all(fetchPromises);
    })
  );
  // 待機せず即座に新しい SW を有効化
  self.skipWaiting();
});

// 2. アクティブ化時：クライアントの制御を即座に奪取
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 3. フェッチ処理
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // GSIマップタイル（地図データ）はオフライン優先でキャッシュ利用
  if (url.host.includes('gsi.go.jp')) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // アプリ本体：キャッシュがあれば返しつつ、バックグラウンドで最新を取得
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request, { cache: 'reload' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
