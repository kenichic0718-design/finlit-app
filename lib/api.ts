// lib/api.ts
import { headers } from 'next/headers';

/**
 * 相対 URL（/api/...）をサーバー実行時に絶対 URL へ解決する。
 * - RSC/Route Handler で使用可能（headers() 利用）
 * - Vercel などのプロキシ環境では X-Forwarded-* を優先
 */
function toAbsolute(input: string): string {
  // すでに絶対 URL ならそのまま
  try {
    // eslint-disable-next-line no-new
    new URL(input);
    return input;
  } catch {
    /* not absolute */
  }

  const h = headers();
  const host =
    h.get('x-forwarded-host') ??
    h.get('host') ??
    'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';

  const base = `${proto}://${host}`;
  if (input.startsWith('/')) return `${base}${input}`;
  return `${base}/${input}`;
}

async function safeText(r: Response) {
  try {
    return await r.text();
  } catch {
    return '';
  }
}

/**
 * サーバー/クライアント両対応の JSON ヘルパ
 * - サーバーでは相対 URL を絶対化
 * - キャッシュは無効化（最新を取得）
 */
export async function getJSON<T>(url: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(toAbsolute(url), {
    ...init,
    cache: 'no-store',
  });
  if (!r.ok) {
    const text = await safeText(r);
    throw new Error(`GET ${url} -> ${r.status} ${r.statusText}\n${text}`);
  }
  return (await r.json()) as T;
}

export async function postJSON<T>(
  url: string,
  body: unknown,
  init: RequestInit = {}
): Promise<T> {
  const r = await fetch(toAbsolute(url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(body ?? {}),
    cache: 'no-store',
    ...init,
  });
  if (!r.ok) {
    const text = await safeText(r);
    throw new Error(`POST ${url} -> ${r.status} ${r.statusText}\n${text}`);
  }
  return (await r.json()) as T;
}

export async function patchJSON<T>(
  url: string,
  body: unknown,
  init: RequestInit = {}
): Promise<T> {
  const r = await fetch(toAbsolute(url), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(body ?? {}),
    cache: 'no-store',
    ...init,
  });
  if (!r.ok) {
    const text = await safeText(r);
    throw new Error(`PATCH ${url} -> ${r.status} ${r.statusText}\n${text}`);
  }
  return (await r.json()) as T;
}

export async function delJSON<T>(url: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(toAbsolute(url), {
    method: 'DELETE',
    cache: 'no-store',
    ...init,
  });
  if (!r.ok) {
    const text = await safeText(r);
    throw new Error(`DELETE ${url} -> ${r.status} ${r.statusText}\n${text}`);
  }
  return (await r.json()) as T;
}

