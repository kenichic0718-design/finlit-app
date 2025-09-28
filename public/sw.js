// ===== FinLit PWA Service Worker (auto update ready) =====

// 新SWに差し替える指示（クライアントから postMessage で送る）
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 有効化されたらすぐ全タブを支配（再読み込み無しで切替の土台）
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ここではキャッシュ戦略なし（Next.js のHTTPキャッシュに委任）
self.addEventListener("fetch", () => {
  // 必要になったら Workbox/next-pwa で差し替えてください
});

