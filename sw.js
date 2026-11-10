// 인터넷이 없어도 열리도록 화면 파일을 보관해 둡니다. 새 버전이 있으면 항상 새 버전을 먼저 받아요.
const CACHE = "gagyebu-v3";
const FILES = ["./", "index.html", "manifest.webmanifest", "supabase.js", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;   // 서버(Supabase) 요청은 그대로 통과
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && !url.search) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match("index.html")))
  );
});
