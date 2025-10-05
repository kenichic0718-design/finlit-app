// app/layout.tsx
import 'server-only';
export const runtime = 'nodejs';
import React from 'react';
import AppClientShell from '@/components/AppClientShell'; // ← ふつうに import

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: 'system-ui' }}>
        <AppClientShell />  {/* ← Client Component */}
        {children}
      </body>
    </html>
  );
}

