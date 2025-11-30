"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginClient() {
  const [email, setEmail] = useState("");

  // 万一ハッシュで戻ってきた場合の保険（/#access_token=...）
  useEffect(() => {
    const href = window.location.href;
    const url = new URL(href);
    const hasHashToken = url.hash.includes("access_token");
    const hasCode = !!url.searchParams.get("code");
    const hasTokenHash = !!url.searchParams.get("token_hash");
    if (hasHashToken || hasCode || hasTokenHash) {
      supabase.auth.exchangeCodeForSession(href).finally(() => {
        // ハッシュを消してトップへ
        window.location.replace("/");
      });
    }
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // ★ ここが肝：必ず /auth/callback に戻す（サーバ側でセッション交換→Set-Cookie）
    const origin = window.location.origin;
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/`,
      },
    });
    alert("メールを送信しました。受信メールのリンクをクリックしてください。");
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">ログイン</h1>
      <form onSubmit={sendMagicLink} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border rounded px-3 py-2"
        />
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">
          マジックリンクを送る
        </button>
      </form>
      <p className="text-sm text-gray-500">
        受信メールのリンクは <code>/auth/callback</code> に戻ります。サーバ側でセッションを確立してからトップへ遷移します。
      </p>
    </div>
  );
}

