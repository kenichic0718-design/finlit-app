// components/CategoryManager.tsx
"use client";
import * as React from "react";
import { toast } from "./ToastHost";

type Cat = { id: string; name: string; kind: "expense" | "income"; order_index?: number };
type GetRes = { ok: boolean; guest?: boolean; items: Cat[]; error?: string };

async function fetchCats(kind: "expense" | "income"): Promise<GetRes> {
  const r = await fetch(`/api/categories?kind=${kind}`, { cache: "no-store" });
  return (await r.json()) as GetRes;
}

export default function CategoryManager() {
  const [expense, setExpense] = React.useState<Cat[]>([]);
  const [income, setIncome] = React.useState<Cat[]>([]);
  const [guest, setGuest] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const [e, i] = await Promise.all([fetchCats("expense"), fetchCats("income")]);
      setExpense(e.items ?? []);
      setIncome(i.items ?? []);
      setGuest(Boolean(e.guest || i.guest));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  async function add(kind: "expense" | "income", name: string) {
    if (guest) return toast("追加するにはサインインしてください");
    const r = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, name }),
    });
    const j = await r.json();
    if (!j?.ok) return toast(j?.error || "作成に失敗しました");
    toast("カテゴリを追加しました");
    reload();
  }
  async function rename(id: string, name: string) {
    if (guest) return toast("変更するにはサインインしてください");
    const r = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const j = await r.json();
    if (!j?.ok) return toast(j?.error || "名称変更に失敗しました");
    toast("名称を変更しました");
    reload();
  }
  async function remove(id: string) {
    if (guest) return toast("削除するにはサインインしてください");
    if (!confirm("このカテゴリを削除します。よろしいですか？")) return;
    const r = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!j?.ok) return toast(j?.error || "削除に失敗しました");
    toast("削除しました");
    reload();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Section
        title="支出カテゴリ"
        items={expense}
        loading={loading}
        disabled={guest}
        placeholder="例）食費"
        onAdd={(name) => add("expense", name)}
        onRename={rename}
        onRemove={remove}
      />
      <Section
        title="収入カテゴリ"
        items={income}
        loading={loading}
        disabled={guest}
        placeholder="例）給与"
        onAdd={(name) => add("income", name)}
        onRename={rename}
        onRemove={remove}
      />
    </div>
  );
}

function Section(props: {
  title: string;
  items: Cat[];
  loading: boolean;
  disabled: boolean;
  placeholder: string;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = React.useState("");
  return (
    <div className="rounded border border-zinc-700/60 p-4">
      <h3 className="text-lg font-semibold mb-3">{props.title}</h3>

      <div className="flex gap-2 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={props.placeholder}
          className="px-2 py-2 rounded bg-zinc-900 border border-zinc-700 flex-1"
          disabled={props.disabled}
        />
        <button
          onClick={() => {
            if (!name.trim()) return;
            props.onAdd(name.trim());
            setName("");
          }}
          disabled={props.disabled}
          className="px-3 py-2 rounded border border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
        >
          追加
        </button>
      </div>

      {props.disabled && (
        <p className="text-xs text-yellow-400 mb-2">※ 追加/変更/削除はサインイン時に利用できます</p>
      )}

      {props.loading ? (
        <div className="h-24 rounded bg-zinc-900/40 animate-pulse" />
      ) : props.items.length === 0 ? (
        <div className="h-24 grid place-items-center text-sm text-zinc-400">カテゴリがありません。</div>
      ) : (
        <ul className="space-y-2">
          {props.items.map((c) => (
            <li key={c.id} className="p-3 rounded border border-zinc-700/50">
              <div className="flex items-center gap-2">
                <span className="flex-1">{c.name}</span>
                <button
                  disabled={props.disabled}
                  onClick={async () => {
                    const nv = prompt("新しい名称を入力", c.name);
                    if (!nv || nv === c.name) return;
                    props.onRename(c.id, nv.trim());
                  }}
                  className="px-2 py-1 text-sm rounded border border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
                >
                  名称変更
                </button>
                <button
                  disabled={props.disabled}
                  onClick={() => props.onRemove(c.id)}
                  className="px-2 py-1 text-sm rounded border border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

