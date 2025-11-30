// components/AppClientShell.tsx
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import AuthUrlHandler from "./AuthUrlHandler";
import { trackEvent } from "@/lib/telemetry";
// PWA 用の Service Worker 登録（ブラウザ側でのみ動く安全な副作用）
import "@/app/sw-register";

const SESSION_DAY_KEY = "finlit.session.lastDay";

/**
 * 今日の日付を "YYYY-MM-DD" 形式で返す（ローカルタイム）
 */
function getDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = {
  children: React.ReactNode;
};

/**
 * アプリ全体のクライアントシェル
 *
 * - /app/layout.tsx から全ページをラップしている
 * - ここでテレメトリ（session_start / page_view）を一括管理する
 * - 認証URL処理（AuthUrlHandler）もここで行う
 * - ついでに PWA 用の Service Worker を登録する
 */
export default function AppClientShell({ children }: Props) {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  /**
   * 1日1回だけ送る session_start
   *
   * - ログイン済みで、かつ今日まだ送っていなければ送信
   * - ブラウザの localStorage に "lastDay" を保存して判定
   */
  useEffect(() => {
    if (!pathname) return;

    try {
      const todayKey = getDayKey(new Date());
      const stored = window.localStorage.getItem(SESSION_DAY_KEY);

      if (stored !== todayKey) {
        window.localStorage.setItem(SESSION_DAY_KEY, todayKey);
        // 初回セッション開始イベント
        trackEvent("session_start", { page: pathname }).catch(() => {});
      }
    } catch {
      // localStorage が使えない環境でもアプリが壊れないように握りつぶす
    }
  }, [pathname]);

  /**
   * ページ遷移ごとに送る page_view
   *
   * - usePathname() の変化を監視
   * - 同じパスに対しては二重送信しない
   */
  useEffect(() => {
    if (!pathname) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    trackEvent("page_view", { page: pathname }).catch(() => {});
  }, [pathname]);

  return (
    <>
      {/* Supabase のメールリンク処理など */}
      <AuthUrlHandler />
      {children}
    </>
  );
}

