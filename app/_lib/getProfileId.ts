// app/_lib/getProfileId.ts
"use server";

/**
 * 現在ログイン中ユーザーの profile を初期化＆取得して id を返す。
 * 未ログインなら null を返す。
 * 実装は内部 API /api/profile に委譲する。
 */
export async function getProfileId(): Promise<string | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/profile`, {
      // 相対でも OK だが、ビルド環境によっては絶対 URL が安定
      cache: "no-store",
      // 読み出しだけ（/api/profile 側で必要なら作成も行う）
    });
    const json = await res.json().catch(() => ({} as any));
    if (json?.ok && json?.id) return json.id as string;
    return null;
  } catch {
    return null;
  }
}

