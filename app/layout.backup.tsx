// app/layout.tsx
export const runtime = 'nodejs';

import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

import Nav from "@/components/Nav";
import ToastHost from "@/components/ToastHost";
import AuthBootstrap from "@/components/AuthBootstrap";
import AuthUrlHandler from "@/components/AuthUrlHandler"; // ← useSearchParams を使うので Suspense で包む

export const metadata: Metadata = {
  title: "FinLit PWA",
  description: "学んで、記録して、未来を設計しよう。",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-background text-foreground">
        {/* サーバ側OKな初期化 */}
        <AuthBootstrap />

        {/* useSearchParams を内部で使う可能性があるので Suspense で包む */}
        <Suspense fallback={null}>
          <AuthUrlHandler />
        </Suspense>

        <Nav />

        <main className="container mx-auto px-4 py-6">{children}</main>

        <ToastHost />
      </body>
    </html>
  );
}

