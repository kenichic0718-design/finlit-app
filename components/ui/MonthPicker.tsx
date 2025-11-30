// components/ui/MonthPicker.tsx

type MonthPickerProps = {
  // 既存コードとの互換用
  month?: string;
  // 新しい名前（必要ならこちらでも渡せる）
  ym?: string;
  setYm: (s: string) => void;
};

export default function MonthPicker({ month, ym, setYm }: MonthPickerProps) {
  // ym があれば優先、なければ month を使う
  const value = ym ?? month ?? "";

  return (
    <input
      type="month"
      value={value}
      onChange={(e) => setYm(e.target.value)}
      className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2"
    />
  );
}
