// app/auth/callback/page.tsx
import 'server-only';
import { Suspense } from 'react';
import ClientPage from './ClientPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>Auth Callback</h1>
          <p style={{ marginTop: 8 }}>Loading…</p>
        </main>
      }
    >
      <ClientPage />
    </Suspense>
  );
}

