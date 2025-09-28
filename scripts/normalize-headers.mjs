import fs from "node:fs";

const files = [
  "app/budgets/page.tsx",
  "app/categories/page.tsx",
  "app/dashboard/page.tsx",
  "app/goal/page.tsx",
  "app/learn/page.tsx",
  "app/log/page.tsx",
];

const WANT = [
  "'use client';",
  "export const dynamic = 'force-dynamic';",
  "export const revalidate = 0;",
];

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.log(`skip: ${f}`);
    continue;
  }
  let txt = fs.readFileSync(f, "utf8");

  // BOMとDELを除去
  txt = txt.replace(/^\uFEFF/, "").replace(/\u007F/g, "");

  // 行ごとに処理
  const lines = txt.split(/\r?\n/);

  // 壊れた `'\'use client'\'';` も含め、先頭ヘッダー系を全除去
  const isHeaderLike = (s) =>
    /^\s*['"]use client['"]\s*;?\s*$/.test(s) ||
    /^\s*\\'use client\\'\s*;?\s*$/.test(s) ||         // バックスラッシュ入りの壊れた行
    /^\s*export\s+const\s+dynamic\s*=.*;?\s*$/.test(s) ||
    /^\s*export\s+const\s+revalidate\s*=.*;?\s*$/.test(s);

  const body = lines.filter((s) => !isHeaderLike(s)).join("\n").replace(/^\n+/, "");

  const fixed = [...WANT, "", body].join("\n");
  fs.writeFileSync(f, fixed, "utf8");
  console.log(`fixed: ${f}`);
}
