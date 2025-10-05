import 'server-only';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import React from 'react';
export default function Dashboard() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="opacity-80">（本体UIは順次クライアントコンポーネントへ切り出し）</p>
    </section>
  );
}
