// app/logs/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import ClientBoundary from "./ClientBoundary";

export const dynamic = "force-dynamic";

/**
 * 記録ページ（Server Component）
 *
 * - サーバー側で Supabase のセッションを確認
 * - 未ログインなら簡単な案内だけを表示
 * - ログイン済みなら ClientBoundary（クライアント側の本体）に処理を渡す
 *
 * ※ ログインフローやミドルウェアの挙動は変えない。
 */
export default async function LogsPage() {
  const supabase = supabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // 未ログイン時は、簡単なメッセージのみ表示
  if (error || !user) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-xl font-semibold">記録</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          記録ページを利用するにはログインが必要です。
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          <Link href="/login" className="underline underline-offset-2">
            こちらのログインページから再ログインしてください。
          </Link>
        </p>
      </main>
    );
  }

  // ログイン済みならクライアント側の本体へ
  return (
    <main className="container mx-auto max-w-3xl px-4 py-6">
      <ClientBoundary />
    </main>
  );
}
