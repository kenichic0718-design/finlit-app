// lib/supabase-browser.ts
'use client';

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,           // ブラウザの sb- クッキーを使う
      autoRefreshToken: true,
      detectSessionInUrl: false,      // コールバックで手動セットするので false
    },
  }
);

