export type Kind = 'expense' | 'income';

export type Category = {
  id: string;
  name: string;
  kind: Kind;
  color?: string | null;
  sort_order?: number | null;
};

export type Log = {
  id: number | string;
  profile_id: string;
  category_id: string | null;
  kind: Kind;
  amount: number;
  memo?: string | null;
  happened_on: string; // 'YYYY-MM-DD'
};

export type Budget = {
  id: number | string;
  profile_id: string;
  category_id: string;
  yyyymm: string; // 'YYYYMM'
  amount: number;
};

