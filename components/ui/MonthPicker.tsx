// components/ui/MonthPicker.tsx

type MonthPickerProps = {
  ym: string;
  setYm: (s: string) => void;
};

export default function MonthPicker({ ym, setYm }: MonthPickerProps) {
  return (
    <input
      type="month"
      value={ym}
      onChange={(e) => setYm(e.target.value)}
      className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2"
    />
  );
}
