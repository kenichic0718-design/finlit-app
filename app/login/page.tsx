// app/login/page.tsx（置換：GitHubボタンは削除）
"use client";
import * as React from "react";
import { getSupabaseClient } from "@/app/_supabase/client";
import { toast } from "@/components/ToastHost";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return toast("メールアドレスを入力してください");
    setLoading(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // 🔴 いま開いているドメインに必ず戻す（localhost でも Vercel でもOK）
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?redirect_to=/settings`
            : undefined,
      },
    });
    setLoading(false);
    if (error) return toast(error.message);
    toast("ログイン用リンクを送信しました。メールを確認してください。");
    setEmail("");
  }

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">ログイン</h1>
      <form onSubmit={signInWithEmail} className="space-y-3">
        <div className="space-y-1">
          <label className="block text-sm text-zinc-400">メールアドレス</label>
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700"/>
        </div>
        <button type="submit" disabled={loading}
          className="w-full px-4 py-2 rounded border border-zinc-700 hover:bg-zinc-800 disabled:opacity-60">
          {loading ? "送信中…" : "マジックリンクを送る"}
        </button>
      </form>
      <p className="text-sm text-zinc-500">同じ端末・同じブラウザでは、次回以降のログインは不要です。</p>
    </div>
  );
}

