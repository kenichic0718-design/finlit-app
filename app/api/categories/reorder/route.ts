// app/api/categories/reorder/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/_supabase/server";

/** body: { kind: 'expense'|'income', ids: string[] } */
export async function POST(req: Request) {
  try {
    const { supabase, user } = await getSupabaseServer();
    if (!user) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

    const { ids, kind } = await req.json() as { ids:string[]; kind:"expense"|"income" };
    if (!Array.isArray(ids) || !kind) return NextResponse.json({ ok:false, error:"invalid body" }, { status:400 });

    // 自分のカテゴリのみ対象（共通カテゴリは除外）
    const step = 10;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const order = (i + 1) * step;
      const { error } = await supabase
        .from("categories")
        .update({ sort_order: order })
        .eq("id", id)
        .eq("profile_id", user.id)
        .eq("kind", kind);
      if (error) throw error;
    }

    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e.message ?? e) }, { status:500 });
  }
}

