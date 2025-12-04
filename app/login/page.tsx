// app/login/page.tsx
"use client";

import { useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

// Supabase のブラウザクライアント（@supabase/ssr ベース）
// - 他の lib/logs.ts などと同じ createBrowserClient を使用
// - サーバ側の createServerClient（middleware / supabaseServer）と
//   Cookie 形式が完全に揃う
const supabase = supabaseBrowser();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/";
      const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        next,
      )}`;

      // ★ ここがポイント：
      //   - 以前は createClientComponentClient(@supabase/auth-helpers-nextjs)
      //   - 今回から supabaseBrowser(@supabase/ssr) に統一
      //   → middleware / auth/callback / supabaseServer と同じ
      //     Cookie・セッション形式になる
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callback },
      });

      if (error) throw error;
      setSent(true);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">ログイン</h1>
      {sent ? (
        <p className="text-sm">メールのリンクを確認してください。</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2"
            placeholder="you@example.com"
          />
          <button
            disabled={loading || isPending}
            className="rounded-md bg-blue-600 px-4 py-2 disabled:opacity-50"
          >
            ログインリンクを送る
          </button>
        </form>
      )}
    </main>
  );
}

