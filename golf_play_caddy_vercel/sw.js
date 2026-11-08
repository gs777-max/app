// SmartCaddie Pro Service Worker
// 目的: アプリ本体と地図タイルをキャッシュし、山間部など電波の弱い現場でも地図が真っ白にならないようにする。
// データ系API (コース同期・気象・Overpass) は絶対にキャッシュしない (古いデータを掴ませない)。
const CACHE_VERSION = 'smartcaddie-v3';
const TILE_CACHE = 'smartcaddie-tiles-v1';
const TILE_MAX = 1500; // タイルキャッシュの上限 (古いものから捨てる) ※事前ダウンロード分を保持できるよう拡張

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(['./', './index.html'])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => ![CACHE_VERSION, TILE_CACHE].includes(k)).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

async function trimTileCache() {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  if (keys.length > TILE_MAX) {
    await Promise.all(keys.slice(0, keys.length - TILE_MAX).map((k) => cache.delete(k)));
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 同期API・外部データAPIはネットワーク専用 (キャッシュしない)
  if (url.pathname.startsWith('/api/')) return;
  if (/(overpass|open-meteo|nominatim|sunrise-sunset|rainviewer|getelevation)/.test(url.href)) return;

  // 地図タイル (地理院・OSM) はキャッシュ優先 (オフラインでも地図を出す)
  if (/(gsi\.go\.jp|tile\.openstreetmap\.org|unpkg\.com|jsdelivr|googleapis\.com|gstatic\.com)/.test(url.href)) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res && res.ok) {
          cache.put(req, res.clone());
          trimTileCache();
        }
        return res;
      }).catch(() => fetch(req))
    );
    return;
  }

  // アプリ本体はネットワーク優先・失敗時キャッシュ (更新を取りこぼさない)
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
