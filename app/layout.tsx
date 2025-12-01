// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import TopNav from "@/components/TopNav";
import RequiredGate from "@/components/RequiredGate";
import AppClientShell from "@/components/AppClientShell";
import ProfileInitClient from "@/components/ProfileInitClient";

export const metadata: Metadata = {
  title: "FinLit PWA",
  description:
    "大学生のための家計管理・ミニクイズ・シミュレーションで金融リテラシーを学べる Web アプリ",
  // ★ テーマカラーを黒に変更
  themeColor: "#000000",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // ★ こちらも黒に揃える
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <RequiredGate>
          {/* ログインチェックを通過したタイミングで、プロフィール＆カテゴリ初期化を1回だけ実行 */}
          <ProfileInitClient />
          <AppClientShell>
            <TopNav />
            {children}
          </AppClientShell>
        </RequiredGate>
      </body>
    </html>
  );
}
