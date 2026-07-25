const CACHE_NAME = 'zarimap-app-v1';
const TILE_CACHE_NAME = 'zarimap-tiles-v1';

// アプリの基本ファイル（事前キャッシュ）
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

// 1. インストール時に基本ファイルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. 古いキャッシュの削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== TILE_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. リクエストの制御（地図タイルのキャッシュ処理）
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 国土地理院の地図タイル（または他のタイルサーバー）のリクエストの場合
  if (requestUrl.hostname.includes('cyberjapandata.gsi.go.jp')) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then(async (cache) => {
        // ① まずキャッシュを探す
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse; // キャッシュがあればそれを返す（オフライン表示）
        }

        // ② キャッシュがなければネットワーク（通信）から取得
        try {
          const networkResponse = await fetch(event.request);
          // 正常に取得できたらキャッシュに保存する
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // 通信エラー（完全にオフラインで、かつ未読み込みの場所）の場合は何も返さない
          console.log('Tile fetch failed and not in cache:', event.request.url);
        }
      })
    );
    return;
  }

  // 地図タイル以外の通常のファイル（Cache First）
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
