// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * メールリンク / OAuth などから戻ってきたときのコールバックページ
 *
 * - Magic Link 等: token_hash を verifyOtp(type: "email") に渡してセッションを張る
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
      //   /auth/callback?token_hash=xxx&type=magiclink&next=/dashboard
      //   /auth/callback?next=%2F?token_hash=xxx&type=magiclink
      //   /auth/callback?code=xxxxx&next=/dashboard
      const code = searchParams.get("code");
      const rawNext = searchParams.get("next") ?? "/";

      // next (%2F?token_hash=...) をデコード
      let decodedNext = rawNext;
      try {
        decodedNext = decodeURIComponent(rawNext);
      } catch {
        // decode に失敗したらそのまま使う
      }

      // URL 全体・next の中から token_hash を探す
      let tokenHash = searchParams.get("token_hash");
      let typeParam = searchParams.get("type"); // 例: "magiclink"

      if (!tokenHash || !typeParam) {
        const [, queryPart] = decodedNext.split("?");
        if (queryPart) {
          const inner = new URLSearchParams(queryPart);
          tokenHash = tokenHash || inner.get("token_hash");
          typeParam = typeParam || inner.get("type");
        }
      }

      // 遷移先は「? 以降を切り捨て」「先頭 / のものだけ許可」
      const nextPathRaw = decodedNext.split("?")[0] || "/";
      const nextPath = nextPathRaw.startsWith("/") ? nextPathRaw : "/";

      try {
        if (tokenHash) {
          // 🔹 Magic Link / Email OTP 用ルート
          // Supabase の仕様上、メール系 OTP の type は "email" を使う
          // （"magiclink" は非推奨 & エラーの原因になる）
          const { error } = await (supabase.auth as any).verifyOtp({
            token_hash: tokenHash,
            type: "email",
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

