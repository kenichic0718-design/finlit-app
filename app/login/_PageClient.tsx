// app/login/_PageClient.tsx
'use client';

import * as React from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { toast } from '@/app/_utils/toast';

export default function PageClient() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const search = typeof window !== 'undefined' ? window.location.search : '';
  const params = React.useMemo(() => new URLSearchParams(search), [search]);
  const nextPath = params.get('next') || '/settings';

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          // ★ 直接保護ページに飛ばさず、一度 /auth/callback 経由にする
          emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) throw error;
      const m = 'ログイン用のメールを送信しました。メール内のリンクを開いてください。';
      setMsg(m); toast(m, 'success');
    } catch (e: any) {
      const m = e?.message ?? '送信に失敗しました。時間をおいて再試行してください。';
      setErr(m); toast(m, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">ログイン</h1>
      <p className="text-sm text-zinc-600">メールに届くマジックリンクでサインインします。</p>

      {msg && <div className="rounded border border-green-300 bg-green-50 p-3 text-sm">{msg}</div>}
      {err && <div className="rounded border border-red-300 bg-red-50 p-3 text-sm">{err}</div>}

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm">メールアドレス</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="you@example.com"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded border hover:bg-zinc-100 disabled:opacity-60"
        >
          {loading ? '送信中…' : 'マジックリンクを送る'}
        </button>
      </form>

      <p className="text-xs text-zinc-500">期限切れ・無効化されたリンクの場合は、もう一度メールを送ってください。</p>
    </div>
  );
}

