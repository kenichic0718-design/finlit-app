import { createClient } from '@supabase/supabase-js';

const url = process.env.TEST_SUPABASE_URL!;
const service = process.env.TEST_SUPABASE_SERVICE_ROLE!;
export const yyyymm = process.env.TEST_YYYYMM!;
export const profileId = process.env.TEST_PROFILE_ID!;

const admin = createClient(url, service, { auth: { persistSession: false } });

function monthToRange(ym: string) {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(4, 6));
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1); // 翌月1日（[from, to) 半開区間）
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export async function resetAndSeed() {
  const { from, to } = monthToRange(yyyymm);

  // 1) その月のデータを削除
  await admin.from('budgets')
    .delete()
    .eq('profile_id', profileId)
    .eq('yyyymm', yyyymm);

  await admin.from('logs')
    .delete()
    .eq('profile_id', profileId)
    .gte('date', from)
    .lt('date', to);

  // 2) 予算を投入（例）
  await admin.from('budgets').insert([
    { profile_id: profileId, category: '食費',   amount: 1000,  yyyymm },
    { profile_id: profileId, category: '交通',   amount: 15000, yyyymm },
    { profile_id: profileId, category: '日用品', amount: 3000,  yyyymm },
    { profile_id: profileId, category: '通信',   amount: 15000, yyyymm },
  ]);

  // 3) 実績ログを投入（ymd/yyyymm はDB側で自動計算）
  const y = yyyymm.slice(0,4), m = yyyymm.slice(4,6);
  await admin.from('logs').insert([
    { profile_id: profileId, date: `${y}-${m}-18`, category: '交通',   amount: 10000, is_income: false },
    { profile_id: profileId, date: `${y}-${m}-18`, category: '日用品', amount: 5000,  is_income: false },
    { profile_id: profileId, date: `${y}-${m}-18`, category: '通信',   amount: 10000, is_income: false },
    { profile_id: profileId, date: `${y}-${m}-20`, category: '食費',   amount: 15000, is_income: false },
  ]);
}
