// app/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

/**
 * ダッシュボード（Server Component）
 *
 * - サーバー側で Supabase セッションを確認
 * - 未ログインなら案内メッセージのみ表示
 * - ログイン済みなら DashboardClient（クライアント側本体）へ委譲
 *
 * ※ 認証フロー／middleware には手を入れない。
 */
export default async function HomePage() {
  const supabase = supabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return (
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold">ダッシュボード</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ダッシュボードを利用するにはログインが必要です。
        </p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <DashboardClient />
    </main>
  );
}

