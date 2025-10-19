// app/settings/page.tsx
import 'server-only';

import { redirect } from "next/navigation";
import PageClient from "./_PageClient";
import { getSupabaseServer } from "@/lib/supabase/server";

type CatRow = { id: string; name: string; kind: "expense" | "income" };

export default async function SettingsPage() {
  const supabase = getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // プロフィール取得（存在しない場合でも空配列で描画を続行）
  const { data: prof } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const profileId = prof?.id ?? null;

  let expense: CatRow[] = [];
  let income: CatRow[] = [];

  if (profileId) {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,kind")
      .eq("profile_id", profileId)
      .order("sort", { ascending: true, nulls: "last" });

    const all = error ? [] : (data ?? []);
    expense = all.filter((c) => c.kind === "expense");
    income  = all.filter((c) => c.kind === "income");
  }

  // 必ず配列を渡す（undefined は渡さない）
  return (
    <PageClient
      expenseCategories={expense}
      incomeCategories={income}
    />
  );
}

