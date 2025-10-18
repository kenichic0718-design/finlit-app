// app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { requireAuthProfile } from "@/lib/supabase/server";

// 小さなヘルパ
const json = (body: unknown, init = 200) =>
  NextResponse.json(body as any, { status: init });

type Ctx = { params: { id: string } };

// PATCH /api/categories/:id
export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireAuthProfile();
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  let name: string | undefined;
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

  return json({ ok: true, item: data }, 200);
}

