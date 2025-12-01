// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FinLit PWA",
    short_name: "FinLit",
    description:
      "大学生のための家計管理・ミニクイズ・シミュレーションで金融リテラシーを学べる Web アプリ",
    start_url: "/",
    display: "standalone",
    lang: "ja",

    // ★ テーマカラーを黒に統一
    theme_color: "#000000",
    background_color: "#000000",

    // ★ PWA アイコン設定：さっき作った app/icon.svg を使う
    icons: [
      {
        src: "/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
