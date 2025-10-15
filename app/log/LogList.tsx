// app/log/LogList.tsx
import 'server-only';
import { getSupabaseServer } from '@/lib/supabase/server';

type Row = {
  id: number;
  date: string | null;
  amount: number;
  is_income: boolean | null;
  category: string | null;
  created_at: string;
};

export default async function LogList() {
  const supabase = getSupabaseServer();

  // 現在ログイン中ユーザーを取得
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return <p>ログインしていません。</p>;
  }

  // 直近の記録10件をサーバ直クエリで取得（セッションはサーバ側で保持される）
  const { data, error } = await supabase
    .from('logs')
    .select('id,date,amount,is_income,category,created_at')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return <p>読み込みに失敗しました：{error.message}</p>;
  }
  if (!data || data.length === 0) {
    return <p>まだ記録がありません。</p>;
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">直近の記録</h2>
      <ul className="space-y-2">
        {data.map((r: Row) => (
          <li key={r.id} className="border rounded p-2">
            <div className="text-sm opacity-70">
              {r.date ?? new Date(r.created_at).toLocaleDateString('ja-JP')}
            </div>
            <div className="font-medium">
              {r.is_income ? '収入' : '支出'}：{Math.round(r.amount)} 円
              {r.category ? `（${r.category}）` : ''}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

