// components/RequiredGate.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// /learn/required の「今日の必須5問」が完了した日付を保存するキー
// app/learn/required/Client.tsx の STORAGE_KEY と揃えておくこと
const REQUIRED_DAYKEY_STORAGE_KEY = "finlit_required_last_daykey";

// ゲートによって /learn/required へ飛ばす前に、元いたパスを一時的に保存するキー
const RETURN_TO_KEY = "finlit.requiredQuiz.returnTo";

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/auth", // /auth/callback など
  "/reset-password",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some((prefix) => {
    return pathname === prefix || pathname.startsWith(prefix + "/");
  });
}

// AM5:00 を境に日付を切り替える dayKey 生成ロジック
function getDayKey(now: Date): string {
  const shifted = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, "0");
  const d = String(shifted.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 強制5問ゲート
 *
 * - 1日1回（AM5:00区切り）、「今日の必須5問」を必ず踏ませる
 * - 今日分を解き終わると localStorage に dayKey が保存される
 * - その dayKey が今日と一致しない限り、ログイン後の遷移先を /learn/required に差し替える
 */
export default function RequiredGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!pathname) return;

    // ログイン画面やコールバックなど、「未ログインでも通すパス」は素通し
    if (isPublicPath(pathname)) {
      setChecked(true);
      return;
    }

    // 必須5問のページ自体は素通し
    if (
      pathname === "/learn/required" ||
      pathname.startsWith("/learn/required/")
    ) {
      setChecked(true);
      return;
    }

    if (typeof window !== "undefined") {
      const todayKey = getDayKey(new Date());
      const storedKey = window.localStorage.getItem(
        REQUIRED_DAYKEY_STORAGE_KEY,
      );

      // 既に今日分の必須5問を解き終わっている → ゲートは素通し
      if (storedKey === todayKey) {
        setChecked(true);
        return;
      }

      // まだ今日分が終わっていない場合 → 元いたパスを保存してから /learn/required へ
      try {
        window.sessionStorage.setItem(RETURN_TO_KEY, pathname);
      } catch {
        // sessionStorage が使えない環境では単に保存せずに進める
      }

      router.replace("/learn/required");
      return;
    }

    // 念のためのフォールバック（SSRなど）: この場合はゲートで止めない
    setChecked(true);
  }, [pathname, router]);

  // 判定中・リダイレクト中は一旦何も描画しない（チラつき防止）
  if (!checked) {
    return null;
  }

  return <>{children}</>;
}

/**
 * /learn/required 側から使うヘルパー
 *
 * 現状は Client 側が直接 localStorage を扱っているため必須ではないが、
 * 必要に応じて「今日分完了」を明示的にマークする用途向けに残しておく。
 */
export function markRequiredQuizDoneForToday() {
  if (typeof window === "undefined") return;
  try {
    const todayKey = getDayKey(new Date());
    window.localStorage.setItem(REQUIRED_DAYKEY_STORAGE_KEY, todayKey);
    window.sessionStorage.removeItem(RETURN_TO_KEY);
  } catch {
    // no-op
  }
}

