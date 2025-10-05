// lib/cookie/safe-json.ts
export function parseJsonCookie(value: string | undefined | null) {
  if (!value) return null
  const raw = value.startsWith('base64-')
    ? (typeof window === 'undefined'
        ? Buffer.from(value.slice(7), 'base64').toString('utf-8')
        : decodeURIComponent(escape(atob(value.slice(7)))))
    : value
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

