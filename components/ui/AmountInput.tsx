// components/ui/AmountInput.tsx
import { useEffect, useState } from "react";

export default function AmountInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [v, setV] = useState<string>(value ? String(value) : "");

  useEffect(() => {
    setV(value ? String(value) : "");
  }, [value]);

  const commit = (s: string) => {
    const n = Number(s.replace(/[^\d]/g, "")) || 0;
    onChange(Math.max(0, n));
  };
  const step = (d: number) => {
    const n = (Number(v.replace(/[^\d]/g, "")) || 0) + d;
    onChange(Math.max(0, n));
  };

  return (
    <div className="flex items-center gap-2">
      <input
        inputMode="numeric"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => commit(v)}
        placeholder="例: 15000"
        className="w-48 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2"
      />
      <div className="flex gap-1">
        <button className="rounded-lg border border-zinc-700 px-2 py-1" onClick={() => step(1000)}>
          +1,000
        </button>
        <button className="rounded-lg border border-zinc-700 px-2 py-1" onClick={() => step(10000)}>
          +10,000
        </button>
        <button className="rounded-lg border border-zinc-700 px-2 py-1" onClick={() => step(-1000)}>
          -1,000
        </button>
      </div>
    </div>
  );
}

