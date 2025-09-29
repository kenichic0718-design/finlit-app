"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/app/_supabase/client";

type Row = { category: string; total: number };

export default function CategoryPie() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // vid 準備
  useEffect(() => {
    fetch("/api/profile").catch(() => {});
  }, []);

  useEffect(() => {
    let aborted = false;
    (async () => {
      // 例：支出合計をカテゴリ別に集計するビュー/クエリがある前提
      const { data, error } = await supabase
        .rpc("category_expense_totals") // ない場合はあなたの実装に合わせてください
        .select();

      if (!aborted) {
        if (error) {
          setMsg(`集計に失敗：${error.message}`);
          setRows([]);
        } else {
          setMsg(null);
          setRows((data ?? []) as Row[]);
        }
      }
    })();
    return () => {
      aborted = true;
    };
  }, [supabase]);

  if (msg) return <p className="text-sm text-muted">{msg}</p>;
  if (rows.length === 0) return <p className="text-sm text-muted">データがありません。</p>;

  // 実際の円グラフはお好みのライブラリで。ここでは簡易表示に留めます
  return (
    <ul className="text-sm space-y-1">
      {rows.map((r) => (
        <li key={r.category} className="flex justify-between">
          <span>{r.category}</span>
          <span>{r.total.toLocaleString()} 円</span>
        </li>
      ))}
    </ul>
  );
}

