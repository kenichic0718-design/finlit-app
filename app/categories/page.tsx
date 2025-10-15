// app/categories/page.tsx
import 'server-only';
import CategoryManagerClient from './CategoryManagerClient'; // ← 普通に直import

export const dynamic = 'force-dynamic';

export default function CategoriesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">カテゴリ管理</h1>
      <CategoryManagerClient />
    </main>
  );
}

