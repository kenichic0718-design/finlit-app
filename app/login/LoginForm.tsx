// app/login/LoginForm.tsx
'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setMsg(null)
    try {
      // 開発中は localhost:3100、Vercel では NEXT_PUBLIC_SITE_URL を使う
      const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${site}/auth/callback` },
      })
      if (error) throw error
      setMsg('ログイン用のリンクをメールで送信しました。メールを確認してください。')
    } catch (err: any) {
      setMsg(err?.message ?? '送信に失敗しました')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSend} className="space-y-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded border px-3 py-2"
      />
      <button
        type="submit"
        disabled={sending}
        className="rounded px-4 py-2 border"
      >
        {sending ? '送信中…' : 'メールでログインリンクを送る'}
      </button>

      {msg && <p className="mt-3 opacity-80">{msg}</p>}
    </form>
  )
}

