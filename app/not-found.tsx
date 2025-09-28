// app/not-found.tsx
import { Suspense } from "react";

export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <section className="container mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-4">ページが見つかりませんでした</h1>
        <p className="opacity-80">URL を確認するか、ナビゲーションから移動してください。</p>
      </section>
    </Suspense>
  );
}

