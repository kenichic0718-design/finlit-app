// app/categories/page.tsx
import 'server-only';
import dynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const CategoryManagerClient = dynamic(() => import('./CategoryManagerClient'), {
  ssr: false,
});

export default function CategoriesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">カテゴリ管理</h1>
      <CategoryManagerClient />
    </main>
  );
}

