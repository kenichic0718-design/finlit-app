// app/api/categories/add/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin, envReady } from "@/app/_supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    if (!envReady()) {
      return NextResponse.json({ ok: false, message: "Not ready" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const name = (body?.name ?? "").trim();
    const kind = body?.kind as "expense" | "income" | undefined;

    if (!name || (kind !== "expense" && kind !== "income")) {
      return NextResponse.json(
        { ok: false, message: "name と kind（expense|income）は必須です" },
        { status: 400 }
      );
    }

    const supa = getSupabaseAdmin();

    // order_index を末尾にする（kind 内の最大+1）
    const { data: maxRows, error: maxErr } = await supa
      .from("categories")
      .select("order_index")
      .eq("kind", kind)
      .order("order_index", { ascending: false })
      .limit(1);

    if (maxErr) throw maxErr;
    const nextOrder = (maxRows?.[0]?.order_index ?? -1) + 1;

    const { data, error } = await supa
      .from("categories")
      .insert({ name, kind, order_index: nextOrder })
      .select("*")
      .single();

    if (error) throw error;

    revalidatePath("/log");
    revalidatePath("/settings");

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? "サーバーエラー" },
      { status: 500 }
    );
  }
}
