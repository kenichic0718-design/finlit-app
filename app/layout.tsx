// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import TopNav from "@/components/TopNav";
import RequiredGate from "@/components/RequiredGate";
import AppClientShell from "@/components/AppClientShell";

export const metadata: Metadata = {
  title: "FinLit PWA",
  description:
    "大学生のための家計管理・ミニクイズ・シミュレーションで金融リテラシーを学べる Web アプリ",
  themeColor: "#0f766e",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
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
          <AppClientShell>
            <TopNav />
            {children}
          </AppClientShell>
        </RequiredGate>
      </body>
    </html>
  );
}

