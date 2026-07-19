/* 曼谷之旅 offline service worker
 * 策略：核心資源預快取（cache-first），HTML network-first（有網路拿最新版），
 * Google Fonts 執行期快取，天氣 API 一律走網路（widget 自帶錯誤處理）。
 * 部署新版時 bump CACHE_VERSION 讓舊快取失效。 */
const CACHE_VERSION = "tt7d-v1";
const PRECACHE = [
  "./",
  "index.html",
  "assets/css/style.css",
  "assets/js/data.js",
  "assets/js/app.js",
  "assets/vendor/react.production.min.js",
  "assets/vendor/react-dom.production.min.js",
  "assets/fonts/openhuninn.woff2",
  "assets/img/icon-192.png",
  "assets/img/icon-512.png",
  "manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // 天氣 / 匯率等 API：只走網路，失敗交給 app 自己處理
  if (url.hostname.includes("open-meteo.com") || url.hostname.includes("frankfurter.app")) return;

  // HTML：network-first，斷網時用快取
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put("index.html", copy));
          return res;
        })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  // 其他（本站資源 + Google Fonts）：cache-first，未命中則抓網路並回填
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res.ok && (url.origin === location.origin || url.hostname.includes("fonts.g"))) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
