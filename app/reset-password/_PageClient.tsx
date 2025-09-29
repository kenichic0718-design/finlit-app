'use client';

// app/reset-password/page.tsx

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/app/_supabase/client';

export default function ResetPasswordPage() {
  const supabase = getSupabaseBrowser();
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setReady(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(() => setReady(true));
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (pwd.length < 8) return setErr('パスワードは8文字以上にしてください。');
    if (pwd !== pwd2) return setErr('確認用パスワードが一致しません。');
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) return setErr(error.message);
    setMsg('パスワードを更新しました。ログインページへ移動します。');
    setTimeout(() => (window.location.href = '/login'), 1200);
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-bold">新しいパスワードを設定</h1>
      {!ready ? (
        <p className="text-sm text-muted">認証リンクを確認しています… このページはメールのリンクから開いてください。</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input type="password" className="input w-full" placeholder="新しいパスワード（8文字以上）" value={pwd} onChange={(e)=>setPwd(e.target.value)} required />
          <input type="password" className="input w-full" placeholder="新しいパスワード（確認用）" value={pwd2} onChange={(e)=>setPwd2(e.target.value)} required />
          <button className="btn w-full">更新する</button>
        </form>
      )}
      {msg && <p className="text-green-500 text-sm">{msg}</p>}
      {err && <p className="text-red-500 text-sm">{err}</p>}
    </div>
  );
}
