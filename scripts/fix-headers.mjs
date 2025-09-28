import fs from "node:fs";

const FILES = [
  "app/budgets/page.tsx",
  "app/categories/page.tsx",
  "app/dashboard/page.tsx",
  "app/goal/page.tsx",
  "app/learn/page.tsx",
  "app/log/page.tsx",
];

const HEADER = [
  "'use client';",
  "export const dynamic = 'force-dynamic';",
  "export const revalidate = 0;",
  "",
].join("\n");

// 行が「'use client'」かどうか（シングル/ダブル/バッククォート対応）
const isUseClientLine = (s) =>
  /^\s*(['"`])use client\1\s*;?\s*$/.test(s);

// dynamic / revalidate 行か
const isDynamicLine = (s) =>
  /^\s*export\s+const\s+dynamic\s*=/.test(s);
const isRevalidateLine = (s) =>
  /^\s*export\s+const\s+revalidate\s*=/.test(s);

for (const f of FILES) {
  if (!fs.existsSync(f)) continue;

  // 読み込み & 制御文字除去（BOM, DEL）
  let txt = fs.readFileSync(f, "utf8")
    .replace(/^\uFEFF/, "")
    .replace(/\u007F/g, "");

  // 行ごとに分割
  let lines = txt.split(/\r?\n/);

  // 既存の 'use client' / dynamic / revalidate を全域から除去
  lines = lines.filter(
    (line) => !isUseClientLine(line) && !isDynamicLine(line) && !isRevalidateLine(line)
  );

  // 先頭に正しいヘッダを付与
  let fixed = HEADER + lines.join("\n");

  // 余計な空行（先頭の多重改行）を軽く整形
  fixed = fixed.replace(/\n{3,}/, "\n\n");

  fs.writeFileSync(f, fixed, "utf8");
  console.log("fixed:", f);
}
