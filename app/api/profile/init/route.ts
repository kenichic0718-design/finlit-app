// app/api/profile/init/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServer as createClient } from '@/lib/supabase/server';

const COOKIE_NAME = "vid";

export async function POST() {
  const cookieStore = cookies();
  let vid = cookieStore.get(COOKIE_NAME)?.value;

  const supabase = createClient();

  // 既に cookie があれば、その visitor_id のプロフィールを探す／なければ作る
  if (!vid) {
    vid = randomUUID();
    // cookie をここ（Route）で発行：← Server Action/Route ならOK
    cookieStore.set(COOKIE_NAME, vid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1年
    });
  }

  // profiles に既存が無ければ作る
  // テーブル: public.profiles(id uuid PK, user_id uuid null, visitor_id uuid null, created_at ...)
  // id はアプリで使う profile_id
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("visitor_id", vid)
    .maybeSingle();

  let profileId = existing?.id;
  if (!profileId) {
    profileId = randomUUID();
    await supabase.from("profiles").insert({ id: profileId, visitor_id: vid });
  }

  return NextResponse.json({ profileId, visitorId: vid });
}

