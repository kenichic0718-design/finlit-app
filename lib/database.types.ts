// lib/database.types.ts
// Supabase 用の最小限のダミー型定義
// 型チェック用だけなので、ランタイムの挙動には影響しません。

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ここでは厳密なスキーマは持たせず any でごまかします。
// 既存コードの型参照はすべて any 扱いになりますが、動作は変わりません。
export type Database = any;

