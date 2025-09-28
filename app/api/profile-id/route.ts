import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// ブラウザ識別用Cookie名（任意）
const COOKIE_NAME = "finlit_vid";

function newVid() {
  // Node/Edge両対応のUUID
  // @ts-ignore
  return (globalThis.crypto ?? require("crypto").webcrypto).randomUUID();
}

// 既存VIDの確認（副作用なし）
export async function GET() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value ?? null;
  return NextResponse.json({ vid: existing });
}

// VIDが無ければ「発行」して返す（←ここで Cookie を set する）
export async function POST() {
  const cookieStore = await cookies();
  let vid = cookieStore.get(COOKIE_NAME)?.value;

  if (!vid) {
    vid = newVid();
    const res = NextResponse.json({ vid });
    res.cookies.set(COOKIE_NAME, vid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1年
    });
    return res;
  }
  return NextResponse.json({ vid });
}

