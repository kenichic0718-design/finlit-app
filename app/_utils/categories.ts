// app/_utils/categories.ts
export type Kind = "expense" | "income";
export type Category = {
  id: string;
  name: string;
  kind: Kind;
  color?: string | null;
  profile_id?: string | null;
  order_index?: number | null;
};

type ListResp = { ok: true; items: Category[] } | { ok: false; error: string };
type CreateResp = { ok: true; item: Category } | { ok: false; error: string };

export async function listCategories(kind: Kind | "all", init?: RequestInit): Promise<ListResp> {
  const res = await fetch(`/api/categories?kind=${kind}`, {
    cache: "no-store",
    ...(init ?? {}),
  });
  return res.json();
}

export async function createCategory(payload: { name: string; kind: Kind }): Promise<CreateResp> {
  const res = await fetch(`/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function renameCategory(id: string, name: string) {
  const res = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function deleteCategory(id: string) {
  const res = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });
  return res.json();
}

export async function sortCategories(updates: Array<{ id: string; order_index: number }>) {
  const res = await fetch(`/api/categories/sort`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ updates }),
  });
  return res.json();
}

