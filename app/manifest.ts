// app/manifest.ts

/**
 * FinLit PWA 用 Web App Manifest
 *
 * - ホーム画面に追加したときの名前やテーマカラーなどを定義
 * - アイコンは一旦 /file.svg を使い、PNG アイコンは余裕があれば後で追加
 */
export default function manifest() {
  return {
    name: "FinLit PWA",
    short_name: "FinLit",
    description:
      "大学生のための家計管理・ミニクイズ・シミュレーションで金融リテラシーを学べる Web アプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    lang: "ja",
    icons: [
      {
        src: "/file.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      // もし余裕があれば public/icon-192.png, icon-512.png などを用意して
      // 以下のような項目を足せばより「PWA らしい」形になります：
      // {
      //   src: "/icon-192.png",
      //   sizes: "192x192",
      //   type: "image/png",
      // },
      // {
      //   src: "/icon-512.png",
      //   sizes: "512x512",
      //   type: "image/png",
      // },
    ],
  };
}
