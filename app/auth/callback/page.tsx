// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * メールのマジックリンクから戻ってきたときのコールバックページ。
 *
 * - URL（クエリ + #フラグメント）からセッション情報を取り出して保存
 * - 保存が終わったら next パラメータ、なければ "/" へリダイレクト
 *
 * → サーバ側で code を扱わず、公式の email OTP フローに合わせる。
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";

  useEffect(() => {
    const run = async () => {
      const supabase = supabaseBrowser();

      try {
        // メールリンク由来のトークンを URL から読み取り、セッションを保存
        await supabase.auth.getSessionFromUrl({ storeSession: true });
      } catch (error) {
        // 失敗しても、とりあえず next へ飛ばす（/api 側で未ログイン扱いになるだけ）
        console.error("[auth/callback] getSessionFromUrl error:", error);
      } finally {
        router.replace(nextPath);
      }
    };

    run();
  }, [router, nextPath]);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">ログイン処理中...</h1>
      <p className="text-sm text-neutral-300">
        数秒待っても画面が切り替わらない場合は、ブラウザの更新ボタンを押してください。
      </p>
    </main>
  );
}

