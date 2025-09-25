"use client";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginForm() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr(error.message); // supabase からのエラー文言を表示
      return;
    }
    // 成功 → 任意の遷移
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-sm">
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="email"
        className="input"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="password"
        className="input"
      />
      <button className="btn">メール＋パスワードでログイン</button>
      {err && <p className="text-red-500 text-sm">{err}</p>}
    </form>
  );
}

