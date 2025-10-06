// app/api/categories/delete/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin, envReady } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    if (!envReady()) {
      return NextResponse.json({ ok: false, message: "Not ready" }, { status: 500 });
    }
    const { id } = (await req.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ ok: false, message: "id が必要です" }, { status: 400 });
    }

    const supa = getSupabaseAdmin();
    const { error } = await supa.from("categories").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 409 });
    }

    revalidatePath("/log");
    revalidatePath("/budgets");
    revalidatePath("/settings");

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? "サーバーエラー" },
      { status: 500 }
    );
  }
}
