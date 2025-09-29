'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// app/sim/page.tsx
export const dynamic = "force-dynamic";
export default function SimIndex() {
  const Item = ({ title, desc, href }:{title:string;desc:string;href:string}) => (
    <a href={href} className="block border border-line rounded-2xl p-4 hover:bg-white/5 transition">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted mt-1">{desc}</div>
    </a>
  );
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">シミュレーター</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <Item title="インフレ対応ゴール" desc="名目/実質で必要額と推移を比較" href="/sim/goal-inflation" />
        <Item title="DCA vs 一括" desc="分布で“勝率”を体感" href="/sim/dca-vs-lump" />
      </div>
    </div>
  );
}

