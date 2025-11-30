// app/dashboard/Client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchJson,
  normalizeLogs,
  normalizeBudgets,
  sumByKind,
  yen,
  ymOf,
  LogItem,
  BudgetItem,
} from "@/lib/finance";

export default function DashboardPage() {
  const [ym, setYm] = useState<string>(new Date().toISOString().slice(0, 7));
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [buds, setBuds] = useState<BudgetItem[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rawL, rawB] = await Promise.all([
          fetchJson(`/api/logs?ym=${ym}`),
          fetchJson(`/api/budgets?ym=${ym}`),
        ]);
        if (!active) return;

        // ★ occurredAt → occurred_at に修正
        setLogs(
          normalizeLogs(rawL).filter((x) => ymOf(x.occurred_at) === ym)
        );
        setBuds(normalizeBudgets(rawB).filter((x) => x.month === ym));
      } catch (e) {
        console.error(e);
        if (!active) {
          /* noop */
        }
        setLogs([]);
        setBuds([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [ym]);

  const usedExp = useMemo(() => sumByKind(logs, "expense"), [logs]);
  const usedInc = useMemo(() => sumByKind(logs, "income"), [logs]);
  const budExp = useMemo(() => sumByKind(buds, "expense"), [buds]);
  const budInc = useMemo(() => sumByKind(buds, "income"), [buds]);

  const pctExp =
    budExp === 0 ? 0 : Math.min(100, Math.round((usedExp / budExp) * 100));
  const pctInc =
    budInc === 0 ? 0 : Math.min(100, Math.round((usedInc / budInc) * 100));

  return (
    <main className="mx-auto max-w
