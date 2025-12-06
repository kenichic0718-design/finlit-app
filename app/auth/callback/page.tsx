// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * メールリンク / OAuth などから戻ってきたときのコールバックページ
 *
 * - URL に含まれる code もしくは token_hash/type を Supabase に渡してセッションを張る
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
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const typeParam = searchParams.get("type");
      const nextParam = searchParams.get("next") ?? "/";

      // next は絶対パスだけ許可（外部サイトへの飛び出し防止）
      const nextPath = nextParam.startsWith("/") ? nextParam : "/";

      try {
        if (code) {
          // PKCE の Auth Code フロー:
          // URL の code をセッションに交換する
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
        } else if (tokenHash && typeParam) {
          // Email / Magic Link 用の token_hash フロー:
          // token_hash + type を verifyOtp に渡してセッションを確立する
          const { error } = await (supabase.auth as any).verifyOtp({
            type: typeParam as any, // "magiclink" | "signup" | "recovery" など
            token_hash: tokenHash,
          });

          if (error) {
            console.error("[auth/callback] verifyOtp error:", error);
            router.replace("/login?error=callback_failed");
            return;
          }
        } else {
          // code も token_hash も無いパターン
          console.error("[auth/callback] no code or token_hash in URL", {
            search: window.location.search,
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
    // searchParams は URL から生成されているので依存に入れて OK
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-400">ログイン処理中です...</p>
    </main>
  );
}

