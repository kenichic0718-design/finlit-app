// components/ToastHost.tsx
"use client";
import * as React from "react";

type Toast = { id: number; message: string };
export default function ToastHost() {
  const [list, setList] = React.useState<Toast[]>([]);
  React.useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<string>).detail || "";
      const id = Date.now();
      setList((prev) => [...prev, { id, message: String(detail) }]);
      setTimeout(() => setList((prev) => prev.filter((t) => t.id !== id)), 2500);
    }
    window.addEventListener("finlit:toast", onToast as any);
    return () => window.removeEventListener("finlit:toast", onToast as any);
  }, []);
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
      {list.map((t) => (
        <div
          key={t.id}
          className="px-4 py-2 rounded bg-zinc-900/90 text-zinc-100 border border-zinc-700/60 shadow"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ヘルパー
export function toast(msg: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("finlit:toast", { detail: msg }));
  }
}

