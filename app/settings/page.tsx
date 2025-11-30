// app/settings/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import SettingsCategories from "./SettingsCategories";

export const dynamic = "force-dynamic";

/**
 * 設定ページ（カテゴリ設定メイン）
 *
 * - サーバー側で Supabase のセッションを確認
 * - 未ログインなら簡単な案内だけを表示
 * - ログイン済みなら SettingsCategories に委譲
 * - 説明文で「記録／予算／ダッシュボードとの関係」を明示
 */
export default async function SettingsPage() {
  const supabase = supabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[/settings] auth.getUser error", error.message);
  }

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold">設定</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          設定を変更するにはログインが必要です。
        </p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 space-y-4">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">設定</h1>
        <p className="text-sm text-muted-foreground">
          ここでは、このアプリで使う「支出／収入カテゴリ」を編集できます。
          「使う」をオフにしたカテゴリは、記録ページや予算ページの入力候補、
          ダッシュボードの集計からは基本的に除外されます（既に登録済みの記録そのものは消えません）。
        </p>
        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
          <li>カテゴリ名はあとから変更できます。</li>
          <li>よく使うものだけを「使う」にしておくと、入力がシンプルになります。</li>
          <li>
            カテゴリ名を大きく変えると、過去の記録を振り返るときに分かりにくくなることがあります。
          </li>
        </ul>
      </header>

      {/* カテゴリ設定本体 */}
      <section>
        <SettingsCategories />
      </section>
    </main>
  );
}

