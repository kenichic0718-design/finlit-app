// app/login/_LoginForm.tsx
'use client';
import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function LoginForm() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr(error.message);
      return;
    }
    window.location.href = '/dashboard';
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-sm">
      <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email" />
      <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="password" />
      <button className="btn">メール＋パスワードでログイン</button>
      {err && <p className="text-red-500 text-sm">{err}</p>}
    </form>
  );
}
