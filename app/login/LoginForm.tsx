'use client';

import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const supabase = getSupabaseBrowser();

  const redirectBase =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== 'undefined' ? window.location.origin : '');
  const emailRedirectTo = `${redirectBase}/auth/callback`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setMsg(null);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo,
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setMsg('マジックリンクを送信しました。メールをご確認ください。');
    } catch (e: any) {
      setErr(e?.message ?? '送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="border px-2 py-1 rounded w-[220px]"
        required
      />
      <div>
        <button
          type="submit"
          disabled={sending}
          className="px-3 py-1 rounded border"
        >
          {sending ? '送信中…' : 'マジックリンクを送る'}
        </button>
      </div>
      {msg && <p className="text-green-600 text-sm">{msg}</p>}
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <p className="text-sm text-zinc-500">
        同じ端末・同じブラウザでは、次回以降のログインは不要です。
      </p>
    </form>
  );
}

