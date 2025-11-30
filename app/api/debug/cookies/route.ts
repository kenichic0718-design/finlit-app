import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const names: string[] = [];
  req.cookies.getAll().forEach((c) => names.push(c.name));
  return NextResponse.json({
    ok: true,
    cookieNames: names,
    sbCookies: names.filter((n) => n.startsWith('sb-')),
    host: req.headers.get('host'),
    url: req.url,
  });
}

