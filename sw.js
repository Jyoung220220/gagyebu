// 인터넷이 없어도 열리도록 화면 파일을 보관해 둡니다. 새 버전이 있으면 항상 새 버전을 먼저 받아요.
const CACHE = "gagyebu-v5";
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
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || (e.request.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});

// 카드 알림: 휴대폰 알림 + 앱 아이콘 숫자 배지
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {}
  const n = d.count || 0;
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.title || "카드 승인 알림", {
      body: d.body || "새 승인내역이 들어왔어요", tag: "gagyebu-inbox", renotify: true,
      icon: "icon-192.png", badge: "icon-192.png", data: { url: "./?inbox=1" }
    }),
    (self.navigator && self.navigator.setAppBadge) ? (n ? self.navigator.setAppBadge(n) : self.navigator.clearAppBadge()).catch(() => {}) : Promise.resolve()
  ]));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) { c.postMessage({ type: "open-inbox" }); return c.focus(); }
    return self.clients.openWindow(e.notification.data && e.notification.data.url || "./?inbox=1");
  }));
});
