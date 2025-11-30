// lib/env.ts
// ⚠️ NEXT_PUBLIC_* はクライアントでも使われるため「静的参照」で取り出す。
// ここで undefined を弾けば、起動直後に原因が分かります（本番/開発どちらでも）。

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

if (!url) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
if (!anon) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const ENV = {
  SUPABASE_URL: url as string,
  SUPABASE_ANON_KEY: anon as string,
  SITE_URL: site as string,
} as const;

