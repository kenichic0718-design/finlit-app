// app/settings/page.tsx
export const dynamic = "force-dynamic";

import SettingsCategories from "./_SettingsCategories";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">設定</h1>

      {/* プロフィール・通知・テーマのプレースホルダー（UIだけ） */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="card-title">プロフィール（予定）</div>
          <div className="card-body text-sm text-muted">表示名やアカウント情報（予定）</div>
        </div>
        <div className="card">
          <div className="card-title">通知（予定）</div>
          <div className="card-body text-sm text-muted">リマインダー・メール通知（予定）</div>
        </div>
        <div className="card">
          <div className="card-title">テーマ（予定）</div>
          <div className="card-body text-sm text-muted">ダーク/ライト、配色（予定）</div>
        </div>
      </div>

      {/* カテゴリ管理（実体はクライアント側で /api/profile を叩いて vid を作成/取得） */}
      <SettingsCategories />
    </div>
  );
}

