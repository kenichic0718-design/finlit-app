export interface LogRow {
  id?: number; // bigint DEFAULT null
  profile_id?: string; // uuid DEFAULT 'b8e9358d-3c7d-4300-9059-f793c6e98215'::uuid
  date?: string; // date DEFAULT CURRENT_DATE
  category?: string; // text DEFAULT null
  amount?: number; // integer DEFAULT null
  memo?: string; // text DEFAULT null
  is_income?: boolean; // boolean DEFAULT false
  created_at?: string; // timestamp with time zone DEFAULT now()
  ymd?: string; // date DEFAULT null
  category_id?: string; // uuid DEFAULT null
  kind?: string; // text DEFAULT null
  yyyymm?: string; // text DEFAULT null
}

export type NewLogInput = {
  profile_id?: string;
  date?: string;
  category?: string;
  amount?: number;
  memo?: string;
  is_income?: boolean;
  ymd?: string;
  category_id?: string;
  kind?: string;
  yyyymm?: string;
}