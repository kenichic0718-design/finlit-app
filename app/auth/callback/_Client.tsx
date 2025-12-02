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
  const [status, setStatus] = React.useState<'exchanging' | 'done' | 'error'>(
    'exchanging',
  );

  React.useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabaseBrowser();

        // 0) エラーメッセージが明示されている場合は即座にログインへ戻す
        if (errorDesc) {
          setStatus('error');
          toast(decodeURIComponent(errorDesc), 'error');
          router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
          return;
        }

        // ハッシュ(#access_token=...&refresh_token=...) 形式もサポート
        const hash = window.location.hash; // "#access_token=...&refresh_token=..."
        const hashParams = new URLSearchParams(
          hash.startsWith('#') ? hash.slice(1) : hash,
        );
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        // サインイン完了後に共通で行う処理
        const completeLogin = async (showToast: boolean) => {
          try {
            // サーバ側 Cookie との同期（/api/auth/callback がある想定）
            try {
              const {
                data: { session },
              } = await supabase.auth.getSession();

              if (session) {
                await fetch('/api/auth/callback', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ session }),
                });
              }
            } catch (e) {
              console.error('[auth/callback] sync error', e);
              // ここでの失敗は致命的ではないので握りつぶす
            }

            // プロファイル / カテゴリ初期化（冪等なので何度叩いてもOK）
            await fetch('/api/profile/init', { method: 'POST' });

            setStatus('done');
            if (showToast) {
              toast('ログインしました。', 'success');
            }
            router.replace(nextPath);
            router.refresh();
          } catch (e) {
            console.error('[auth/callback] completeLogin error', e);
            setStatus('error');
            toast('セッション確立に失敗しました。', 'error');
            router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
          }
        };

        // 1) すでにセッションがある場合（再訪など）
        {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            await completeLogin(false);
            return;
          }
        }

        // 2) 旧スタイル: #access_token / #refresh_token 形式のマジックリンク
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) {
            await completeLogin(true);
            return;
          }
        }

        // 3) 新スタイル: ?code=... （PKCE コード交換）
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            await completeLogin(true);
            return;
          }
        }

        // 4) もう一つのスタイル: ?token_hash=... （verifyOtp フロー）
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: 'email',
            token_hash: tokenHash,
          });
          if (!error) {
            await completeLogin(true);
            return;
          }
        }

        // 5) どれもダメな場合はエラーとしてログインへ戻す
        setStatus('error');
        toast(
          '無効または期限切れのリンクです。もう一度お試しください。',
          'error',
        );
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      } catch (e) {
        console.error('[auth/callback] unexpected error', e);
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
      <p className="mt-2 text-sm text-zinc-600">
        {status === 'exchanging' && 'セッションを確立しています。しばらくお待ちください。'}
        {status === 'done' && '完了しました。移動中…'}
        {status === 'error' && 'エラーが発生しました。ログインに戻ります。'}
      </p>
    </div>
  );
}
