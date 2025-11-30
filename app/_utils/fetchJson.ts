"use client";

export async function fetchJson<T = any>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    credentials: 'include', // ★必須：Cookieを /api へ送る
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 統一エラー形式
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

