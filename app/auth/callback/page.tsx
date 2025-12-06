// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * メールリンクから戻ってきたときのコールバックページ
 *
 * - URL に含まれる code を Supabase に渡してセッションを張る（PKCE）
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
      //   /auth/callback?next=%2F%3Ftoken_hash%3D...&type=magiclink
      const code = searchParams.get("code");
      const nextParam = searchParams.get("next") ?? "/";

      // next は絶対パスだけ許可（外部サイトへの飛び出し防止）
      const nextPath = nextParam.startsWith("/") ? nextParam : "/";

      try {
        if (code) {
          // @supabase/ssr のブラウザクライアントは getSessionFromUrl を持たないので
          // exchangeCodeForSession を使う
          const { error } = await (supabase.auth as any).exchangeCodeForSession({
            code,
          });

          if (error) {
            console.error("[auth/callback] exchangeCodeForSession error:", error);
            router.replace("/login?error=callback_failed");
            return;
          }
        } else {
          // code が無いパターン（今まで missing_code になっていたケース）
          // token_hash だけ来ている可能性もログに残しておく
          const url = new URL(window.location.href);
          const tokenHashFromQuery = url.searchParams.get("token_hash");
          const tokenHashFromNext = (() => {
            const nextUrl = new URL(url.origin + nextPath);
            return nextUrl.searchParams.get("token_hash");
          })();

          console.error("[auth/callback] no code param", {
            tokenHashFromQuery,
            tokenHashFromNext,
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

