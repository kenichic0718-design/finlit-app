// app/auth/callback/page.tsx
import 'server-only';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function Fallback() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Auth Callback</h1>
      <p style={{ marginTop: 8 }}>Processing sign-in…</p>
    </main>
  );
}

export default function Page() {
  // クライアント側でのみ処理する
  const ClientPage = require('./ClientPage').default;
  return (
    <Suspense fallback={<Fallback />}>
      <ClientPage />
    </Suspense>
  );
}

