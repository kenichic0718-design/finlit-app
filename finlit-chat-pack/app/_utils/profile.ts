// app/_utils/profile.ts
import { headers } from "next/headers";

// 現在のYYYYMMを返す（"202509" など）
export function currentYYYYMM(date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${y}${m}`;
}

// Server Component / Route 専用：プロフィールID(= vid)をAPI経由で取得
export async function getProfileId(): Promise<string> {
  const h = await headers(); // ← await が必要
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/profile`, {
    cache: "no-store",
    headers: { cookie: h.get("cookie") ?? "" }, // SSRで Cookie を引き継ぐ
  });

  if (!res.ok) {
    throw new Error(`getProfileId failed: ${res.status} ${await res.text()}`);
  }

  const { vid } = (await res.json()) as { vid: string };
  if (!vid) throw new Error("No vid from /api/profile");
  return vid;
}

