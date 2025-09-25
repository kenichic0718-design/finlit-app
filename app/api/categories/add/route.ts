// app/api/categories/add/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/app/_supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const { profileId, kind, name } = (await req.json()) as {
      profileId: string;
      kind: "expense" | "income";
      name: string;
    };

    if (!profileId || !kind || !name?.trim()) {
      return NextResponse.json(
        { message: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("categories")
      .insert({
        profile_id: profileId,
        kind,
        name: name.trim(),
      })
      .select("id,name,kind")
      .single();

    if (error) {
      // 一意制約違反など
      return NextResponse.json(
        { message: error.message },
        { status: 409 }
      );
    }

    // /log, /budgets のプルダウンにも反映
    revalidatePath("/log");
    revalidatePath("/budgets");

    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "サーバーエラー" },
      { status: 500 }
    );
  }
}

