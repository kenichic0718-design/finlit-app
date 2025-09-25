// app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/_supabase/server";

export async function PATCH(_req: Request, { params }: { params:{ id:string } }) {
  try {
    const { supabase, user } = await getSupabaseServer();
    if (!user) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

    const body = await _req.json() as Partial<{ name:string; color:string }>;
    const { data, error } = await supabase
      .from("categories")
      .update(body)
      .eq("id", params.id)
      .eq("profile_id", user.id) // 自分のだけ編集可
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ ok:true, item:data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e.message ?? e) }, { status:500 });
  }
}

export async function DELETE(_req: Request, { params }: { params:{ id:string } }) {
  try {
    const { supabase, user } = await getSupabaseServer();
    if (!user) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", params.id)
      .eq("profile_id", user.id);
    if (error) throw error;

    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e.message ?? e) }, { status:500 });
  }
}

