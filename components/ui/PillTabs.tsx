// components/ui/PillTabs.tsx
import React from "react";

export function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs
        ${active ? "bg-zinc-800 text-zinc-100 border-zinc-700"
                 : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-100"}`}
    >
      {children}
    </button>
  );
}

