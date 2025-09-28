'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// app/log/page.tsx
import LogForm from "./_LogForm";

export default function Page() {
  return <LogForm />;
}

