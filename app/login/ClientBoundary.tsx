// app/login/ClientBoundary.tsx
"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SITE = process.env.NEXT_PUBLIC_SITE_URL!; // https://finlit-app-chi.vercel.app
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

export default function LoginClientBoundary() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMsg(null);
    try {
      const redirect_to = "/settings"; // 必要に応じて変更可
      const emailRedirectTo = `${SITE}/auth/callback?redirect_to=${encodeURIComponent(
        redirect_to
      )}`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
        },
      });
      if (error) throw error;
      setMsg("Magic link sent. Please check your mailbox.");
    } catch (err: any) {
      console.error("[login] signInWithOtp error:", err?.message || err);
      setMsg("Failed to send magic link. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: "48px auto", padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Sign in</h1>
      <label style={{ display: "block", marginTop: 16 }}>
        <span style={{ display: "block", marginBottom: 6 }}>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          required
          placeholder="you@example.com"
          style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
        />
      </label>
      <button
        type="submit"
        disabled={sending}
        style={{
          marginTop: 16,
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: 0,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {sending ? "Sending…" : "Send magic link"}
      </button>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </form>
  );
}

