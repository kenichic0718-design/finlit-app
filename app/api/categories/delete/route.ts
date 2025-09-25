// app/api/categories/delete/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/app/_supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const { id } = (await req.json()) as { id: string };
    if (!id) {
      return NextResponse.json({ message: "id が必要です" }, { status: 400 });
    }

    const supabase = createClient();

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    revalidatePath("/log");
    revalidatePath("/budgets");

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "サーバーエラー" },
      { status: 500 }
    );
  }
}

