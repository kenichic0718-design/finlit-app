// app/sim/layout.tsx
export const dynamic = "force-dynamic";
export default function SimLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

