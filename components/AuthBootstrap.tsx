// components/AuthBootstrap.tsx
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function AuthBootstrap() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/settings";

  useEffect(() => {
    const supabase = getSupabaseClient();

    // 1) ハッシュのトークンを拾ってセッション確定（implicit）
    // detectSessionInUrl:true なので getSession() だけでOK
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(next);
      }
    });

    // 2) 以降の変更も拾う
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) router.replace(next);
    });
    return () => sub.subscription.unsubscribe();
  }, [router, next]);

  return null;
}

