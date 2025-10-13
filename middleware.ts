// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ✅ 本番ホスト名だけを指定（プロトコルなし）
const PROD_HOST = "finlit-app-chi.vercel.app";

// 内部アセットや除外したいパスはここで弾く
const EXCLUDE_PREFIXES = [
  "/_next/",          // Next.js runtime & chunks
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-touch-icon.png",
  "/images/", "/img/", "/static/", "/public/", // もし使っていれば
];

// この関数に引っかかったらミドルウェアをスキップ
const shouldBypass = (pathname: string) => {
  // 内部アセット
  if (EXCLUDE_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
};

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const host = req.headers.get("host") ?? "";

  // 内部アセットは一切触らない
  if (shouldBypass(url.pathname)) {
    return NextResponse.next();
  }

  // すでに本番ホストならそのまま通す
  if (host === PROD_HOST) {
    return NextResponse.next();
  }

  // それ以外のドメイン（localhost/preview など）は本番へリダイレクト
  // パス・クエリはそのまま維持される
  url.protocol = "https:";
  url.host = PROD_HOST;

  // GET/HEAD は 301、その他（POST/PUT/PATCH/DELETE など）はメソッド温存で 307
  const isSafeMethod = req.method === "GET" || req.method === "HEAD";
  return NextResponse.redirect(url, isSafeMethod ? 301 : 307);
}

// _next などはここで除外してもよいが、上の shouldBypass があるので全体マッチでOK
export const config = {
  matcher: ["/:path*"],
};

