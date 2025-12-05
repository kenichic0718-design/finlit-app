// app/login/page.tsx
"use client";

import { FormEvent, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  const next = searchParams.get("next") ?? "/";

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setErrorMessage("メールアドレスを入力してください。");
      return;
    }

    startTransition(async () => {
      const supabase = supabaseBrowser();

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            // 🔹 メールリンクの遷移先を /auth/callback に一本化
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
              next
            )}`,
          },
        });

        if (error) {
          console.error("[login] signInWithOtp error", error);
          setErrorMessage("ログインリンクの送信に失敗しました。");
          return;
        }

        setSent(true);
      } catch (error) {
        console.error("[login] unexpected error", error);
        setErrorMessage("予期しないエラーが発生しました。");
      }
    });
  };

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">ログイン</h1>

      {sent ? (
        <p>メールのリンクを確認してください。</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              className="w-full rounded border bg-transparent px-3 py-2"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
          >
            ログインリンクを送る
          </button>
        </form>
      )}
    </main>
  );
}

