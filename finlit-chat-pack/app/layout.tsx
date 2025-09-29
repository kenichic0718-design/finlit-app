// app/layout.tsx
export const dynamic = 'force-static';
import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import AuthBootstrap from "@/components/AuthBootstrap";

export const metadata: Metadata = {
  title: "FinLit PWA",
  description: "学ぶ→記録→目標。金融リテラシーと家計管理を一つに。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-dvh bg-surface text-ink">
        <header className="border-b border-line bg-panel/60 backdrop-blur">
          <div className="container py-3 flex items-center justify-between gap-4">
            <div className="text-xl font-bold tracking-tight">FinLit PWA</div>
            <Nav />
          </div>
        </header>

        {/* ← 匿名セッションの初期化（画面には何も出さない） */}
        <AuthBootstrap />

        <main className="container py-6">
          {children}
        </main>

        <footer className="border-t border-line mt-10">
          <div className="container py-4 text-xs text-muted">
            © {new Date().getFullYear()} FinLit. 学んで、記録して、未来を設計しよう。
          </div>
        </footer>
      </body>
    </html>
  );
}

