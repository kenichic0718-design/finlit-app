// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * メールリンク / OAuth などから戻ってきたときのコールバックページ
 *
 * - Magic Link 等: token_hash + type を verifyOtp に渡してセッションを張る
 *   （token_hash/type が next= の中に埋め込まれているパターンも含めて対応）
 * - OAuth 等: code を exchangeCodeForSession でセッションに交換する
 * - 成功したら next（または / ）へリダイレクト
 * - 失敗したら /login?error=callback_failed へリダイレクト
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const supabase = supabaseBrowser();

      // 例:
      //   /auth/callback?code=xxxxx&next=/dashboard
      //   /auth/callback?token_hash=xxx&type=magiclink&next=%2F
      //   /auth/callback?next=%2F?token_hash=xxx&type=magiclink   ← これにも対応したい
      const code = searchParams.get("code");
      const rawNext = searchParams.get("next") ?? "/";

      // next のデコード（%2F?token_hash=... みたいなケースを素直な文字列に）
      let decodedNext = rawNext;
      try {
        decodedNext = decodeURIComponent(rawNext);
      } catch {
        // decode に失敗したらそのまま使う
      }

      // next の中に token_hash / type が入っている可能性があるので抜き出す
      let tokenHash = searchParams.get("token_hash");
      let typeParam = searchParams.get("type");

      if (!tokenHash || !typeParam) {
        const [, queryPart] = decodedNext.split("?");
        if (queryPart) {
          const inner = new URLSearchParams(queryPart);
          tokenHash = tokenHash || inner.get("token_hash");
          typeParam = typeParam || inner.get("type");
        }
      }

      // 遷移先パスは「? 以降を全部落として」「先頭 / のものだけ許可」
      const nextPathRaw = decodedNext.split("?")[0] || "/";
      const nextPath = nextPathRaw.startsWith("/") ? nextPathRaw : "/";

      try {
        if (tokenHash && typeParam) {
          // 🔹 Magic Link / Email OTP 用の正規ルート（token_hash 優先）
          const { error } = await (supabase.auth as any).verifyOtp({
            type: typeParam as any, // "magiclink" | "email" など
            token_hash: tokenHash,
          });

          if (error) {
            console.error("[auth/callback] verifyOtp error:", error);
            router.replace("/login?error=callback_failed");
            return;
          }
        } else if (code) {
          // 🔹 OAuth など code ベースのフロー用
          const { error } = await (supabase.auth as any).exchangeCodeForSession(
            code
          );

          if (error) {
            console.error(
              "[auth/callback] exchangeCodeForSession error:",
              error
            );
            router.replace("/login?error=callback_failed");
            return;
          }
        } else {
          // code も token_hash も無いパターン
          console.error("[auth/callback] no code or token_hash in URL", {
            search:
              typeof window !== "undefined" ? window.location.search : "",
          });
          router.replace("/login?error=missing_code");
          return;
        }

        // ここまで来たらセッション張れている想定なので next へ
        router.replace(nextPath);
      } catch (e) {
        console.error("[auth/callback] unexpected error:", e);
        router.replace("/login?error=callback_failed");
      }
    };

    run();
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-400">ログイン処理中です...</p>
    </main>
  );
}

