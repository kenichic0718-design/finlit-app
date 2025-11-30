import { supabase } from "./supabase";

export type Category = {
  id: string;
  name: string;
  kind: "expense" | "income";
  color: string | null;
  sort_order: number | null;
};

export async function getMyCategories(): Promise<Category[]> {
  // RLS で自分の profile_id のみ見える想定。明示フィルタ不要。
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, kind, color, sort_order")
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Category[];
}

