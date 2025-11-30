// app/login/_LoginForm.tsx
'use client'

import { useState } from 'react'

export default function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setBusy(true)
    try {
      const res = await fetch('/api/auth/magic', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, next }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setMsg(data?.error ?? '送信に失敗しました。時間をおいて再試行してください。')
        return
      }
      setMsg('送信しました。メールのリンクを開いてサインインしてください。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <input
        type="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="min-w-[260px] rounded bg-neutral-800 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-neutral-700 px-3 py-2 text-sm hover:bg-neutral-600 disabled:opacity-60"
      >
        {busy ? '送信中…' : 'マジックリンクを送る'}
      </button>
      {msg && <p className="text-sm opacity-80">{msg}</p>}
    </form>
  )
}

