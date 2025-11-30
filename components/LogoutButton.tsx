// components/LogoutButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { useState } from 'react';
import { toast } from '@/app/_utils/toast';

export default function LogoutButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
      toast('ログアウトしました', 'success');
      // 戻るで保護ページに戻れないように replace
      router.replace('/login');
      router.refresh();
    } catch (e) {
      toast('ログアウトに失敗しました。リロードして再試行してください。', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onLogout}
      disabled={loading}
      className={`rounded px-3 py-2 border hover:bg-zinc-50 disabled:opacity-60 ${className}`}
    >
      {loading ? '処理中…' : 'ログアウト'}
    </button>
  );
}

