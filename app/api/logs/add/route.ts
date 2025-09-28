// app/api/logs/add/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const body = await req.json();
    const { profile_id, kind, category, amount } = body;

    const { data, error } = await supabase
      .from("logs")
      .insert([
        {
          profile_id, // CSV にあるので必須
          kind,       // "支出" or "収入"
          category,   // 文字列（例: "食費"）
          amount,     // 数値
        },
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

