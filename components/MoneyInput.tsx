"use client";

import { parseYen, yen } from "@/lib/format";
import { useState } from "react";

export function MoneyInput({
  value,
  onChange,
  placeholder = "例: 15000",
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(String(value || ""));
  return (
    <input
      inputMode="numeric"
      className="w-full rounded bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/25"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const v = parseYen(text);
        onChange(v);
        setText(v ? yen(v).replace("円", "") : "");
      }}
      onFocus={(e) => {
        e.currentTarget.select();
        setText(String(parseYen(text) || ""));
      }}
    />
  );
}

