// app/learn/required/page.tsx
import RequiredClient from "./Client";

export const dynamic = "force-dynamic";

/**
 * 今日の必須5問（Server Component）
 *
 * - サーバー側では追加の認証チェックは行わず、そのままクライアントコンポーネントに委譲
 * - 認証やログ保存はクライアント → /api/learn/required-log 経由で行う
 *
 * ※ 余計なログイン導線を増やさないため、このページ単体では
 *    「ログインが必要です」というブロッカーは出さない。
 */
export default function RequiredPage() {
  return <RequiredClient />;
}

