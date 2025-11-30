// components/ui/MonthPicker.tsx
export default function MonthPicker({ ym, setYm }: { month: string; setYm: (s: string) => void }) {
  return (
    <input
      type="month"
      value={ym}
      onChange={(e) => setYm(e.target.value)}
      className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2"
    />
  );
}

