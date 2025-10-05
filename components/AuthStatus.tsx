// components/AuthStatus.tsx
"use client";
import * as React from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { toast } from "@/components/ToastHost";

export default function AuthStatus() {
  const [email, setEmail] = React.useState<string | null>(null);
  const supabase = getSupabaseClient();

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setEmail(data.user?.email ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) toast(error.message);
    else {
      toast("ログアウトしました");
      // 画面の再取得（カテゴリ等の guest 表示に切り替える）
      location.reload();
    }
  }

  if (!email) {
    return (
      <Link href="/login" className="px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800">
        ログイン
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-400">{email}</span>
      <button onClick={signOut} className="px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800">
        ログアウト
      </button>
    </div>
  );
}

