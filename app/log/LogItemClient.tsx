'use client';

import { useState } from 'react';

export default function LogItemClient(props: {
  id: number;
  amount: number;
}) {
  const { id, amount } = props;
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm('この記録を削除します。よろしいですか？')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      location.reload();
    } catch (e) {
      alert('削除に失敗しました。');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function onEdit() {
    const raw = prompt('金額を入力してください（整数）', String(Math.round(amount)));
    if (raw == null) return;
    const next = Number(raw);
    if (!Number.isFinite(next) || next <= 0) {
      alert('正しい金額を入力してください');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      location.reload();
    } catch (e) {
      alert('更新に失敗しました。');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex gap-2 ml-2">
      <button
        onClick={onEdit}
        disabled={busy}
        className="text-blue-600 underline disabled:opacity-50"
      >
        編集
      </button>
      <button
        onClick={onDelete}
        disabled={busy}
        className="text-red-600 underline disabled:opacity-50"
      >
        削除
      </button>
    </span>
  );
}

