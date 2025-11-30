import { ReactNode } from 'react';

export default function Card({
  title,
  children,
}: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 shadow">
      {title && <h2 className="mb-2 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

