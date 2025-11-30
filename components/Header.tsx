// components/Header.tsx
'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  const doSignout = async () => {
    setLoading(true)
    await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
    setLoading(false)
    router.push('/login')
  }

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
      href={href}
      className={pathname === href ? 'underline font-semibold' : 'hover:underline'}
    >
      {children}
    </Link>
  )

  return (
    <header className="w-full border-b border-zinc-800">
      <div className="mx-auto max-w-5xl flex items-center gap-4 p-3">
        <div className="mr-auto text-sm flex gap-4">
          <NavLink href="/settings">設定</NavLink>
          <NavLink href="/budgets">予算</NavLink>
          <NavLink href="/logs">記録</NavLink>
        </div>
        <button
          onClick={doSignout}
          disabled={loading}
          className="px-3 py-1 rounded border border-zinc-700 text-sm"
        >
          {loading ? 'ログアウト中…' : 'ログアウト'}
        </button>
      </div>
    </header>
  )
}

