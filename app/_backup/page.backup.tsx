// @ts-nocheck

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/_supabase"; // ←必要に応じてパス調整

// 現在年月(YYYYMM)
const NOW_YYYYMM = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
})();

// YYYYMM → 月初/翌月初 (YYYY-MM-DD)
function monthRange(yyyymm: string): readonly [string, string] {
  const y = Number(yyyymm.slice(0, 4));
  const m = Number(yyyymm.slice(4, 6));
  const s = new Date(Date.UTC(y, m - 1, 1));
  const e = new Date(Date.UTC(y, m, 1)); // 翌月1日
  const toStr = (dt: Date) =>
    `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-01`;
  return [toStr(s), toStr(e)] as const;
}

// 訪問者の profile_id をローカルから取得（無ければ作る）
async function getOrCreateProfileId(): Promise<string> {
  const KEYS = ["visitor_id", "finlit_visitor_id"];
  let vid: string | null = null;
  for (const k of KEYS) {
    const v = typeof window !== "undefined" ? localStorage.getItem(k) : null;
    if (v) {
      vid = v;
      break;
    }
  }
  if (!vid) {
    vid = crypto.randomUUID();
    localStorage.setItem("visitor_id", vid);
    for (const k of KEYS) if (k !== "visitor_id") localStorage.setItem(k, vid);
  }

  // users: id = profiles.id, visitor_id
  const { data: u, error: ue } = await supabase
    .from("users")
    .select("id")
    .eq("visitor_id", vid)
    .maybeSingle();

  if (!ue && u?.id) return u.id;

  const profileId = crypto.randomUUID();
  // profiles を作成（既存なら 23505 を許容）
  const { error: pe } = await supabase
    .from("profiles")
    .insert({ id: profileId })
    .select("id")
    .single();
  if (pe && pe.code !== "23505") throw pe;

  const { error: ue2 } = await supabase
    .from("users")
    .insert({ id: profileId, visitor_id: vid })
    .select("id")
    .single();
  if (ue2 && ue2.code !== "23505") throw ue2;

  return profileId;
}

type Row = { category: string; budget: number; actual: number };

export default function Page() {
  const [yyyymm, setYyyymm] = useState(NOW_YYYYMM);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateProfileId().then(setProfileId).catch((e) => {
      console.error(e);
      setErr(e?.message ?? String(e));
    });
  }, []);

  useEffect(() => {
    if (!profileId) return;
    (async () => {
      setErr(null);
      setRows(null);

      try {
        // ① 予算（該当月）
        const { data: bdata, error: bErr } = await supabase
          .from("budgets")
          .select("category, amount, yyyymm")
          .eq("yyyymm", yyyymm);
        if (bErr) throw bErr;

        const budgetMap = new Map<string, number>();
        for (const b of bdata ?? []) {
          const key = String(b.category);
          const val = Number(b.amount) || 0;
          budgetMap.set(key, (budgetMap.get(key) || 0) + val);
        }

        // ② 記録（該当月、支出のみ、ログイン不要）
        const [from, to] = monthRange(yyyymm);
        const { data: ldata, error: lErr } = await supabase
          .from("logs")
          .select("category, amount, is_income, ymd, profile_id")
          .eq("profile_id", profileId)
          .eq("is_income", false)
          .gte("ymd", from)
          .lt("ymd", to);
        if (lErr) throw lErr;

        const actualMap = new Map<string, number>();
        for (const r of ldata ?? []) {
          const key = String(r.category);
          const val = Math.abs(Number(r.amount) || 0);
          actualMap.set(key, (actualMap.get(key) || 0) + val);
        }

        // ③ カテゴリの和集合で行を作る（＝予算なしでも記録だけで表示）
        const cats = new Set<string>([
          ...budgetMap.keys(),
          ...actualMap.keys(),
        ]);
        const next: Row[] = [...cats]
          .sort((a, b) => a.localeCompare(b, "ja"))
          .map((c) => ({
            category: c,
            budget: budgetMap.get(c) || 0,
            actual: actualMap.get(c) || 0,
          }));

        setRows(next);
      } catch (e: any) {
        console.error(e);
        setErr(e?.message ?? String(e));
      }
    })();
  }, [profileId, yyyymm]);

  const totals = useMemo(
    () =>
      (rows ?? []).reduce(
        (a, r) => {
          a.budget += r.budget;
          a.actual += r.actual;
          return a;
        },
        { budget: 0, actual: 0 }
      ),
    [rows]
  );

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">ダッシュボード</h1>

      <div className="flex items-center gap-2">
        <span>対象:</span>
        <input
          value={yyyymm}
          onChange={(e) => setYyyymm(e.target.value.replace(/\D/g, ""))}
          className="border rounded px-2 py-1 bg-transparent"
          placeholder="YYYYMM"
          inputMode="numeric"
          maxLength={6}
        />
      </div>

      {err && <div className="text-red-400 text-sm">取得失敗: {err}</div>}
      {!rows && !err && <div>読み込み中...</div>}

      {rows && (
        <div className="space-y-2">
          <div className="text-sm opacity-70">
            合計 予算: {totals.budget.toLocaleString()} 円 / 実績:{" "}
            {totals.actual.toLocaleString()} 円
          </div>

          <table className="w-full border border-zinc-700 rounded text-sm">
            <thead>
              <tr className="bg-zinc-800">
                <th className="text-left p-2">カテゴリ</th>
                <th className="text-right p-2">予算</th>
                <th className="text-right p-2">実績</th>
                <th className="text-right p-2">差額</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const diff = (r.budget || 0) - (r.actual || 0);
                return (
                  <tr key={r.category} className="border-t border-zinc-700">
                    <td className="p-2">{r.category}</td>
                    <td className="p-2 text-right">
                      {Number(r.budget).toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      {Number(r.actual).toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      {diff.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

