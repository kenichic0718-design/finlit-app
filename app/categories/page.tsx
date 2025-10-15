// app/categories/page.tsx
import 'server-only';
import NextDynamic from 'next/dynamic';  // ← 別名にして衝突回避

export const dynamic = 'force-dynamic';

// 遅延読み込み：初期HTMLは軽く、クライアントのみで動く箇所を分離
const CategoryManagerClient = NextDynamic(
  () => import('./CategoryManagerClient'),
  { ssr: false }
);

export default function CategoriesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">カテゴリ管理</h1>
      <CategoryManagerClient />
    </main>
  );
}

