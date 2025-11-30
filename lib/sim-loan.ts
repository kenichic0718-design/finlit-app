// lib/sim-loan.ts
export type RepayMethod = '元利均等' | '元金均等';
export type LoanKind = '第一種(無利子)' | '第二種(有利子)';

export type LoanParams = {
  kind: LoanKind;
  principal: number;     // 元金（円）
  months: number;        // 返済回数（月）
  annualRatePct: number; // 年利(%) 第二種のみ使用。第一種は0固定で無視
  startYYYYMM: string;   // 返済開始のYYYY-MM（見た目用）
  deferMonths: number;   // 据置（月）。第二種のみで、利息を元金へ繰入する想定をON/OFF可
  capitalizeDuringDefer: boolean; // 据置中利息の元加（繰入）を行うか
  method: RepayMethod;   // 返済方式
};

export type ScheduleRow = {
  idx: number;           // 1..n
  yyyymm: string;        // 返済年月
  payment: number;       // 返済額
  interest: number;      // 利息
  principal: number;     // 元金
  balance: number;       // 残高
};

export type LoanResult = {
  monthlyPayment: number;     // 初回の月返済額（元利均等なら一定）
  totalPayment: number;       // 総支払
  totalInterest: number;      // 総利息
  payoffYYYYMM: string;       // 完済年月
  schedule: ScheduleRow[];
};

const clampInt = (n: number) => Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));

const addMonthsStr = (yyyymm: string, add: number) => {
  const [y, m] = yyyymm.split('-').map((v) => parseInt(v, 10));
  const d = new Date(y, m - 1 + add, 1);
  const yy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${yy}-${mm}`;
};

export function calcLoan(params: LoanParams): LoanResult {
  const p0 = clampInt(params.principal);
  const n0 = clampInt(params.months);
  const rate = params.kind === '第一種(無利子)' ? 0 : Math.max(0, params.annualRatePct) / 100;
  const rm = rate / 12; // 月利
  const method = params.method;
  const start = params.startYYYYMM || '2025-04';
  const defer = params.kind === '第二種(有利子)' ? clampInt(params.deferMonths) : 0;
  const capitalize = params.kind === '第二種(有利子)' ? !!params.capitalizeDuringDefer : false;

  // 据置中の取り扱い：
  //  - 第一種：利息なし→何もせず
  //  - 第二種：利息だけ発生。capitalize=true のとき、据置終了時に元金へ繰入
  let principal = p0;
  if (defer > 0 && rate > 0) {
    let accrued = 0;
    let bal = p0;
    for (let i = 0; i < defer; i++) {
      const r = Math.floor(bal * rm);
      if (capitalize) {
        // 元金に月次で付けていく（単利/複利の中庸：JASSOの厳密計算とは異なるがMVP用途で近似）
        bal += r;
      } else {
        accrued += r;
      }
    }
    principal = Math.max(0, Math.floor(bal));
    // capitalize=false の場合は据置利息は支払総額に上乗せ扱い（スケジュールには含めず注記で表示）
    // MVPでは注記テキストで提示、金額は totalPayment へ最後に加算する
  }

  const n = Math.max(1, n0);
  let monthly = 0;

  if (rate === 0 || method === '元金均等') {
    // 無利子は元金均等でOK。第二種×元金均等もここで。
    // 毎月の元金は一定、利息は残高×rm
    // monthly（表示用）は初回支払額
    const principalPart = Math.floor(principal / n);
    const firstInterest = Math.floor(principal * rm);
    monthly = principalPart + firstInterest; // 初回目安
  } else {
    // 元利均等：A = P * r * (1+r)^n / ((1+r)^n - 1)
    const r = rm;
    const pow = Math.pow(1 + r, n);
    monthly = Math.floor((principal * r * pow) / (pow - 1));
  }

  // スケジュール生成
  const schedule: ScheduleRow[] = [];
  let bal = principal;
  let totalInterest = 0;
  let totalPayment = 0;
  for (let i = 0; i < n; i++) {
    const yyyymm = addMonthsStr(start, i);
    let interest = Math.floor(bal * rm);
    if (rate === 0) interest = 0;

    let payment: number;
    let principalPay: number;

    if (rate === 0 || method === '元金均等') {
      const principalPart =
        i === n - 1 ? bal : Math.floor(principal / n); // 端数は最終回に吸収
      principalPay = Math.min(bal, principalPart);
      payment = principalPay + interest;
    } else {
      // 元利均等
      payment = i === n - 1 ? bal + interest : monthly; // 最終回端数調整
      principalPay = Math.max(0, payment - interest);
      if (principalPay > bal) principalPay = bal;
    }

    bal -= principalPay;
    totalInterest += interest;
    totalPayment += payment;

    schedule.push({
      idx: i + 1,
      yyyymm,
      payment,
      interest,
      principal: principalPay,
      balance: Math.max(0, bal),
    });
  }

  // 据置利息（capitalize=false）の場合は総支払に加算（UI側で注記）
  if (defer > 0 && rate > 0 && !capitalize) {
    // 近似：月利×据置月数×元金（残高一定近似）
    const approxAccrued = Math.floor(p0 * rm * defer);
    totalPayment += approxAccrued;
    totalInterest += approxAccrued;
  }

  const payoffYYYYMM = addMonthsStr(start, n - 1);

  return {
    monthlyPayment: schedule[0]?.payment ?? 0,
    totalPayment,
    totalInterest,
    payoffYYYYMM,
    schedule,
  };
}

// CSVダウンロード用（UTF-8）
export function scheduleToCSV(rows: ScheduleRow[]): string {
  const header = ['#', '年月', '返済額', '利息', '元金', '残高'].join(',');
  const body = rows
    .map((r) => [r.idx, r.yyyymm, r.payment, r.interest, r.principal, r.balance].join(','))
    .join('\n');
  return `${header}\n${body}\n`;
}

