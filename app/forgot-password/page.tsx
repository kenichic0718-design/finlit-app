'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// app/forgot-password/page.tsx

import { useState } from 'react';
import { getSupabaseBrowser } from '@/app/_supabase/client';

export default function ForgotPasswordPage() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setErr(error.message);
    setMsg('再設定用のメールを送信しました。受信箱を確認してください。');
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-bold">パスワード再設定メールを送る</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input type="email" className="input w-full" placeholder="メールアドレス" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <button className="btn w-full" disabled={loading}>{loading ? '送信中…' : 'メールを送信'}</button>
      </form>
      {msg && <p className="text-green-500 text-sm">{msg}</p>}
      {err && <p className="text-red-500 text-sm">{err}</p>}
    </div>
  );
}
