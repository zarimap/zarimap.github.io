const CACHE_NAME = 'zarimap-static-v1';
const TILE_CACHE_NAME = 'zarimap-gsi-tiles-v1';

// Pre-cache 対象の基本ファイル
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/ja/',
  '/ja/index.html',
  '/en/',
  '/en/index.html',
  '/assets/css/style.css',
  '/assets/js/map-logic.js',
  '/assets/icons/apple-touch-icon.png',
  '/assets/data/zarigani.csv'/
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// 1. インストール時：キャッシュを最新状態で取得して事前保持
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Installing: Force fetching fresh assets from network');
      const fetchPromises = STATIC_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'reload' });
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (err) {
          console.warn('[SW] Fetch failed for:', url, err);
        }
      });
      return Promise.all(fetchPromises);
    })
  );
  self.skipWaiting();
});

// 2. アクティブ化時：旧キャッシュ削除と即時有効化
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
    }).then(() => self.clients.claim())
  );
});

// 3. フェッチ処理（すべて Network First 戦略）
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 地理院地図タイル（オフライン優先 Cache First）
  if (url.host.includes('gsi.go.jp')) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(event.request, networkRes.clone());
            }
            return networkRes;
          });
        });
      })
    );
    return;
  }

  // CSV・HTML・JS・CSS 等すべて：Network First (ネットワーク優先 ➔ 失敗時キャッシュ)
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((networkRes) => {
        // 正常に最新データが取得できたらキャッシュを上書き保存
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // パラメータ付きのURLでもマッチするようにリクエストを保存
            cache.put(event.request, resClone);
          });
        }
        return networkRes;
      })
      .catch(() => {
        console.log('[SW] Network failed. Falling back to cache for:', event.request.url);
        // 通信失敗（オフライン・電波障害時）のみ、保存されているキャッシュを返す
        return caches.match(event.request, { ignoreSearch: true });
      })
  );
});
