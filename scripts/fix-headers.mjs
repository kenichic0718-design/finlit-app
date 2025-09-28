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

const isDynamicLine = (s) => /^\s*export\s+const\s+dynamic\s*=/.test(s);
const isRevalidateLine = (s) => /^\s*export\s+const\s+revalidate\s*=/.test(s);

// 「use client」を含む行は、形が変でも全部消す
const isUseClientLike = (s) => /use client/.test(s);

for (const f of FILES) {
  if (!fs.existsSync(f)) continue;
  let txt = fs.readFileSync(f, "utf8")
    .replace(/^\uFEFF/, "")   // BOM
    .replace(/\u007F/g, "");  // DEL

  let lines = txt.split(/\r?\n/);

  // 既存の use client / dynamic / revalidate を全域から除去
  lines = lines.filter(
    (line) => !isUseClientLike(line) && !isDynamicLine(line) && !isRevalidateLine(line)
  );

  // 正しいヘッダを先頭に付与
  let fixed = HEADER + lines.join("\n");

  // 余計な多重空行の軽整形
  fixed = fixed.replace(/\n{3,}/g, "\n\n");

  fs.writeFileSync(f, fixed, "utf8");
  console.log("fixed:", f);
}
