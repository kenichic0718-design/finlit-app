// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import AuthUrlHandler from "@/components/AuthUrlHandler";
// ↓ トーストを全体で使っている場合だけ有効化（無ければこの import と <ToastHost /> を削除）
import ToastHost from "@/components/ToastHost";

export const metadata: Metadata = {
  title: "FinLit PWA",
  description: "学んで、記録して、未来を設計しよう。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        {/* どこに着地しても ?code=... を検知してセッション確立 → /settings へ誘導 */}
        <AuthUrlHandler />

        {/* 共通ヘッダー（ナビ＋ログイン導線） */}
        <Header />

        {/* ページ本体 */}
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

        {/* グローバルトースト（使っていれば残す） */}
        <ToastHost />
      </body>
    </html>
  );
}

