/**
 * ブラウザ起動時に SW を登録し、更新が見つかったら自動で即時反映する。
 */
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // タブを開いている間は定期的に更新確認（5分間隔）
        if (typeof reg.update === "function") {
          setInterval(() => reg.update(), 5 * 60 * 1000);
        }

        // 新しいSWを検出したとき
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            // 旧SWが稼働中に新SWが install 完了 → すぐ置き換え指示
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              nw.postMessage({ type: "SKIP_WAITING" });
              setTimeout(() => location.reload(), 100); // 反映のため軽く待ってリロード
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[SW] register failed:", err);
      });
  });
}

