// app/auth/callback/_Client.tsx
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { toast } from '@/app/_utils/toast';

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const code = sp.get('code');
  const tokenHash = sp.get('token_hash');
  const errorDesc = sp.get('error_description');
  const nextPath = sp.get('next') || '/settings';
  const [status, setStatus] = React.useState<'exchanging' | 'done' | 'error'>('exchanging');

  React.useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabaseBrowser();

        if (errorDesc) {
          setStatus('error');
          toast(decodeURIComponent(errorDesc), 'error');
          router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // ★ 既にログイン済みでも初期化APIは冪等→叩いてOK
          await fetch('/api/profile/init', { method: 'POST' });
          setStatus('done');
          router.replace(nextPath);
          router.refresh();
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            await fetch('/api/profile/init', { method: 'POST' }); // ★ ここ
            setStatus('done');
            toast('ログインしました。', 'success');
            router.replace(nextPath);
            router.refresh();
            return;
          }
        }

        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: 'email',
            token_hash: tokenHash,
          });
          if (!error) {
            await fetch('/api/profile/init', { method: 'POST' }); // ★ ここ
            setStatus('done');
            toast('ログインしました。', 'success');
            router.replace(nextPath);
            router.refresh();
            return;
          }
        }

        setStatus('error');
        toast('無効または期限切れのリンクです。もう一度お試しください。', 'error');
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      } catch {
        setStatus('error');
        toast('セッション確立に失敗しました。', 'error');
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      }
    };
    void run();
  }, [code, tokenHash, errorDesc, nextPath, router]);

  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="text-xl font-semibold">サインイン処理中…</h1>
      <p className="text-sm text-zinc-600 mt-2">
        {status === 'exchanging' && 'セッションを確立しています。しばらくお待ちください。'}
        {status === 'done' && '完了しました。移動中…'}
        {status === 'error' && 'エラーが発生しました。ログインに戻ります。'}
      </p>
    </div>
  );
}

