// components/ui/ProgressBar.tsx
export default function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`h-2 w-full rounded-full bg-zinc-800 ${className}`}>
      <div className="h-2 rounded-full bg-teal-500 transition-[width] duration-300" style={{ width: `${v}%` }} />
    </div>
  );
}

