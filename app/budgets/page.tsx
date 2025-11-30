// app/budgets/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import ClientBoundary from "./ClientBoundary";

export const dynamic = "force-dynamic";

/**
 * 予算ページ（Server Component）
 *
 * - サーバー側で Supabase のセッションを確認
 * - 未ログインなら簡単な案内だけを表示
 * - ログイン済みなら ClientBoundary（クライアント側の本体）に処理を渡す
 *
 * ※ ログインフローやミドルウェアの挙動は変えない。
 */
export default async function BudgetsPage() {
  const supabase = supabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[/budgets] auth.getUser error", error.message);
  }

  if (!user) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-6 space-y-3">
        <h1 className="text-xl font-semibold">予算</h1>
        <p className="text-sm text-muted-foreground">
          ログインすると、月ごとのカテゴリ別予算を設定できます。
        </p>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-6">
      <ClientBoundary />
    </main>
  );
}

