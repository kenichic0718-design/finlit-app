"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }
);

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState("Processing sign-in…");

  useEffect(() => {
    const run = async () => {
      try {
        const redirectTo = params.get("redirect_to") || "/";
        const code = params.get("code");
        const token_hash = params.get("token_hash");
        const type = params.get("type"); // e.g. magiclink, recovery

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setMsg("Signed in. Redirecting…");
          router.replace(redirectTo);
          return;
        }

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash,
          });
          if (error) throw error;
          setMsg("Signed in. Redirecting…");
          router.replace(redirectTo);
          return;
        }

        setMsg("No auth code found. Redirecting…");
        router.replace("/");
      } catch (e: any) {
        console.error("[auth/callback] error:", e?.message || e);
        setMsg("Sign-in failed. Please try again from the login page.");
        setTimeout(() => router.replace("/login"), 1200);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Auth Callback</h1>
      <p style={{ marginTop: 8 }}>{msg}</p>
    </main>
  );
}

