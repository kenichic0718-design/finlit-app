// app/_components/Header.tsx  ← Client Component（サインアウトをここで処理）
'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'

export default function Header() {
  const [busy, setBusy] = useState(false)

  const doSignout = useCallback(async () => {
    try {
      setBusy(true)
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // no-op
    } finally {
      // 現在のパスに戻れるよう next を付ける
      const next = encodeURIComponent(location.pathname || '/settings')
      location.href = `/login?next=${next}`
    }
  }, [])

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-900/70 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-3 p-3">
        <Link href="/settings" className="font-semibold">
          家計アプリ
        </Link>

        <nav className="ml-4 flex items-center gap-3 text-sm">
          <Link href="/settings" className="hover:underline">
            設定
          </Link>
          <Link href="/budgets" className="hover:underline">
            予算
          </Link>
          <Link href="/logs" className="hover:underline">
            記録
          </Link>
        </nav>

        <div className="ml-auto">
          <button
            type="button"
            onClick={doSignout}
            disabled={busy}
            className="rounded bg-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-600 disabled:opacity-60"
          >
            {busy ? 'ログアウト中…' : 'ログアウト'}
          </button>
        </div>
      </div>
    </header>
  )
}

