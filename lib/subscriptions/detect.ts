// lib/subscriptions/detect.ts
import { LOOSE_PRESET, STRICT_PRESET, SubscriptionDetectConfig } from './config';

export type LogRow = {
  date: string;                  // 'YYYY-MM-DD'
  kind: 'expense'|'income';
  amount_int: number;
  memo?: string | null;
  category_name?: string | null; // フロントで付与している場合
};

export type Candidate = {
  id: string;                    // 安定ID（メモ語・金額レンジでハッシュ）
  label: string;                 // 表示ラベル（カテゴリ/メモ先頭）
  averageYen: number;            // 代表金額
  occurrences: number;           // 反復回数
  rhythm: 'monthly'|'bi-monthly'|'weekly'|'unknown';
  confidence: '高'|'中'|'低';
  evidence: string;              // 根拠文（回数/平均/日付規則）
};

const toYMD = (d: Date) => d.toISOString().slice(0,10);

export function withinTolerance(a: number, b: number, pct: number) {
  const lo = a * (1 - pct);
  const hi = a * (1 + pct);
  return b >= lo && b <= hi;
}

function dayDiff(a: string, b: string) {
  const A = new Date(a + 'T00:00:00Z').getTime();
  const B = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((B - A) / (1000*60*60*24));
}

function detectRhythm(dates: string[]): Candidate['rhythm'] {
  if (dates.length < 2) return 'unknown';
  const diffs = dates.slice(1).map((d,i)=> dayDiff(dates[i], d));
  const avg = diffs.reduce((s,x)=>s+x,0)/diffs.length;
  if (avg > 45 && avg < 75) return 'bi-monthly';
  if (avg > 20 && avg < 40) return 'monthly';
  if (avg > 5 && avg < 10)  return 'weekly';
  return 'unknown';
}

function confidenceFrom(o: number, rhythm: Candidate['rhythm']): Candidate['confidence'] {
  const base = o >= 3 ? 2 : 1; // 2:高,1:中
  const rBonus = (rhythm==='monthly'||rhythm==='weekly') ? 1 : 0;
  const score = base + rBonus;
  return score >= 3 ? '高' : score >= 2 ? '中' : '低';
}

export function pickWindow(logs: LogRow[], weeks: number): LogRow[] {
  const today = new Date();
  const start = new Date(today.getTime() - weeks*7*24*60*60*1000);
  const s = toYMD(start);
  return logs.filter(l => l.date >= s);
}

/**
 * サブスク候補検出。
 * - 金額近似(±tol)でクラスタ化
 * - 反復回数 >= minOccurrences
 * - リズム推定とメモ語彙で弱加点（確度バッジに反映）
 */
export function detectSubscriptions(
  allLogs: LogRow[],
  config: SubscriptionDetectConfig = LOOSE_PRESET
): Candidate[] {
  const logs = pickWindow(allLogs.filter(l => l.kind==='expense'), config.detectionWindowWeeks)
    .sort((a,b)=> a.date.localeCompare(b.date));

  // 金額レンジクラスタリング（100円単位近似 -> ±tolでまとめる）
  const clusters: { key: string; seed: number; items: LogRow[] }[] = [];
  for (const l of logs) {
    const yen = Math.max(0, Math.round(l.amount_int));
    const found = clusters.find(c => withinTolerance(c.seed, yen, config.amountTolerancePct));
    if (found) found.items.push(l); else clusters.push({ key: String(yen), seed: yen, items: [l] });
  }

  // 候補化
  const cands: Candidate[] = [];
  for (const c of clusters) {
    if (c.items.length < config.minOccurrences) continue;

    const avg = Math.round(c.items.reduce((s,x)=>s+x.amount_int,0)/c.items.length);
    const dates = c.items.map(x=>x.date).sort();
    const rhythm = detectRhythm(dates);

    // メモ語彙による弱加点（ただし候補条件には使わない）
    const hasHint = c.items.some(x=>{
      const m = (x.memo||'').toLowerCase();
      return config.memoHints.some(h=> m.includes(h.toLowerCase()));
    });

    const conf = confidenceFrom(c.items.length + (hasHint?1:0), rhythm);
    const label = c.items[0]?.category_name
      ? `${c.items[0].category_name} / ${(c.items[0].memo||'').trim()||'（メモなし）'}`
      : `${(c.items[0].memo||'').trim()||'（カテゴリ不明）'} `;

    const evidence = `直近${c.items.length}回 / 平均 ${avg.toLocaleString()}円 / ${rhythm==='weekly'?'週次':rhythm==='monthly'?'毎月':rhythm==='bi-monthly'?'隔月':'規則不明'}`;

    cands.push({
      id: `${Math.round(avg/100)*100}-${rhythm}-${label.slice(0,16)}`,
      label: label.trim(),
      averageYen: avg,
      occurrences: c.items.length,
      rhythm,
      confidence: conf,
      evidence,
    });
  }

  // 確度→削減額の順で安定ソート
  const confRank = (c: Candidate['confidence']) => c==='高'?3:c==='中'?2:1;
  return cands
    .sort((a,b)=> confRank(b.confidence)-confRank(a.confidence) || b.averageYen-a.averageYen);
}

