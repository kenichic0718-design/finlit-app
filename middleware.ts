// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 本番ホスト名（必ずドメインだけ。httpsは付けない）
const PROD_HOST = "finlit-app-chi.vercel.app";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const host = req.headers.get("host") || "";

  // すでに本番なら通過
  if (host === PROD_HOST) {
    return NextResponse.next();
  }

  // それ以外（*.vercel.app や localhost など）は本番へ 301
  url.host = PROD_HOST;
  url.protocol = "https:";
  return NextResponse.redirect(url, 301);
}

// 画像/静的ファイルにも適用してOK（HTTP 301 なのでSEO的にも安全）
// もし除外したい場合は下のmatcherを調整してください
export const config = {
  matcher: ["/:path*"],
};

