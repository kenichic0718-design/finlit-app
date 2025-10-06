// app/login/_LoginForm.tsx
'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function _LoginForm() {
  const supabase = getSupabaseBrowser();
  const qs = useSearchParams();

  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);

    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL ?? '';

    const redirectToParam = qs.get('redirect_to') ?? '/settings';

    const emailRedirectTo = new URL('/auth/callback', origin);
    emailRedirectTo.searchParams.set('redirect_to', redirectToParam);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: emailRedirectTo.toString() },
    });

    setLoading(false);
    if (error) return setErr(error.message);
    setMsg('マジックリンクを送信しました。メールをご確認ください。');
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          className="input w-full"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="btn" disabled={loading}>
          {loading ? '送信中…' : 'マジックリンクを送る'}
        </button>
      </form>
      {msg && <p className="text-green-600 text-sm">{msg}</p>}
      {err && <p className="text-red-600 text-sm">{err}</p>}
    </div>
  );
}

