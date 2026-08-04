const CACHE_NAME = 'zarimap-app-v2';
const TILE_CACHE_NAME = 'zarimap-tiles-v2';

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

// 1. インストール時（オンライン時のみ発火して基本ファイルをキャッシュ）
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // STATIC_ASSETS のいずれかが取得できない場合（オフライン時など）はインストールを中断
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // 新しい Service Worker を即座に待機状態からアクティブへ
  self.skipWaiting();
});

// 2. アクティベート時（以前にあった自動のキャッシュ削除を撤去）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    // 削除処理を行わず、即座に制御権を獲得する
    self.clients.claim()
  );
});

// 3. リクエストの制御（地図タイルのキャッシュ ＋ 通常ファイルの Cache First）
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 国土地理院の地図タイル（または他のタイルサーバー）のリクエストの場合
  if (requestUrl.hostname.includes('cyberjapandata.gsi.go.jp')) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then(async (cache) => {
        // ① まずキャッシュを探す（キャッシュを保持し続ける）
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse; // キャッシュがあればそれを返す（オフライン表示）
        }

        // ② キャッシュがなければネットワーク（オンライン時）から取得
        try {
          const networkResponse = await fetch(event.request);
          // 正常に取得できたらキャッシュに永続保存する
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
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
