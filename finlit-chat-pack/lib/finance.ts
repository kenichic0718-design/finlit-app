// lib/finance.ts
export function realRate(nominalAprPct: number, inflationPct: number) {
  const n = nominalAprPct / 100;
  const i = inflationPct / 100;
  return (1 + n) / (1 + i) - 1; // 実質年率
}

export function pmtForTarget({
  target,
  months,
  aprPct,
  initial = 0,
}: { target: number; months: number; aprPct: number; initial?: number }) {
  const r = aprPct / 100 / 12;
  const need = Math.max(target - initial * Math.pow(1 + r, months), 0);
  if (r === 0) return Math.ceil(need / months);
  const pmt = (need * r) / (Math.pow(1 + r, months) - 1);
  return Math.ceil(pmt);
}

export function seriesFromMonthly({
  monthly,
  months,
  aprPct,
  initial = 0,
}: { monthly: number; months: number; aprPct: number; initial?: number }) {
  const r = aprPct / 100 / 12;
  let bal = initial;
  const rows: { m: number; balance: number }[] = [];
  for (let m = 1; m <= months; m++) {
    bal = bal * (1 + r) + monthly;
    rows.push({ m, balance: bal });
  }
  return rows;
}

export function toRealPurchasingPower({
  nominal,
  inflationPct,
}: { nominal: number; inflationPct: number }) {
  // 1年目以降の実質換算：名目 / (1+π)^(t/12)
  // チャート用に月次で使うので、個別に計算する
  return (tMonth: number) =>
    nominal / Math.pow(1 + inflationPct / 100, tMonth / 12);
}

/** -------- DCA vs 一括（簡易GBM） -------- */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randn(seedFn: () => number) {
  // Box–Muller
  const u = seedFn() || 1e-9;
  const v = seedFn() || 1e-9;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function simulateDcaVsLump({
  total,
  months,
  aprPct,
  volPct,
  paths = 200,
  seed = 42,
}: {
  total: number; months: number; aprPct: number; volPct: number; paths?: number; seed?: number;
}) {
  const mu_m = Math.log(1 + aprPct / 100) / 12; // 月次平均対数リターン
  const sigma_m = (volPct / 100) / Math.sqrt(12); // 月次ボラ(近似)
  const monthly = total / months;

  let dcaWins = 0;
  const dcaVals: number[] = [];
  const lumpVals: number[] = [];

  for (let p = 0; p < paths; p++) {
    const rnd = mulberry32(seed + p);
    let price = 1;
    let dcaUnits = 0;
    let cash = 0;

    // 一括はt=0で全額投資
    let lumpUnits = total; // 初期価格1の想定
    for (let m = 1; m <= months; m++) {
      const z = randn(rnd);
      const ret = Math.exp((mu_m - 0.5 * sigma_m ** 2) + sigma_m * z); // GBM月次リターン
      price *= ret;

      // DCA: 毎月“金額”を買う（初期価格1前提なので price で割って口数計算）
      dcaUnits += monthly / price;
    }
    const dcaFinal = dcaUnits * price;
    const lumpFinal = lumpUnits * price; // 初期価格1で買ってそのまま
    if (dcaFinal > lumpFinal) dcaWins++;
    dcaVals.push(dcaFinal);
    lumpVals.push(lumpFinal);
  }

  const winRate = dcaWins / paths;
  const median = (arr: number[]) => {
    const b = [...arr].sort((a, b) => a - b);
    const i = Math.floor(b.length / 2);
    return b.length % 2 ? b[i] : (b[i - 1] + b[i]) / 2;
  };

  return {
    winRate,
    dcaMedian: median(dcaVals),
    lumpMedian: median(lumpVals),
    dcaVals,
    lumpVals,
  };
}

