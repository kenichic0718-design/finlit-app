// app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { requireAuthProfile } from "@/lib/supabase/server";

function json<T>(body: T, status = 200) {
  return NextResponse.json(body as any, { status });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuthProfile();
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  let name = "";
  try {
    const b = await req.json();
    name = (b?.name ?? "").trim();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }
  if (!name) return json({ ok: false, error: "name is required" }, 400);

  const { supabase, profileId } = auth;
  const { data, error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", params.id)
    .eq("profile_id", profileId)
    .select()
    .maybeSingle();

  if (error) return json({ ok: false, error: error.message }, 500);
  if (!data) return json({ ok: false, error: "Not found or not owned" }, 404);
  return json({ ok: true, item: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuthProfile();
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const { supabase, profileId } = auth;
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", params.id)
    .eq("profile_id", profileId)
    .select()
    .maybeSingle();

  if (error) return json({ ok: false, error: error.message }, 500);
  if (!data) return json({ ok: false, error: "Not found or not owned" }, 404);
  return json({ ok: true });
}

