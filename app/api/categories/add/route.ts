// app/api/categories/add/route.ts
import 'server-only';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const url = new URL(req.url);
  url.pathname = '/api/categories';
  const rsp = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await req.text(),
  });
  const body = await rsp.text();
  return new NextResponse(body, { status: rsp.status, headers: rsp.headers });
}

