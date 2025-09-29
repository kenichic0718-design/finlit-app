import { execSync } from "node:child_process";
import fs from "node:fs";

const FILES = execSync('git ls-files "app/**/page.tsx"').toString().trim().split("\n").filter(Boolean);

// 行判定
const isUseClientLine = (s) => /^\s*(['"`])use client\1\s*;?\s*$/.test(s);
const isDynamicLine   = (s) => /^\s*export\s+const\s+dynamic\s*=/.test(s);
const isRevalLine     = (s) => /^\s*export\s+const\s+revalidate\s*=/.test(s);

for (const f of FILES) {
  let txt = fs.readFileSync(f, "utf8")
    .replace(/^\uFEFF/, "")
    .replace(/\u007F/g, "");

  let lines = txt.split(/\r?\n/);

  // 先頭3行はそのまま保持（ここに正しいヘッダーがある前提）
  const head = lines.slice(0, 3);
  let body = lines.slice(3);

  // 本文から 'use client' / dynamic / revalidate を全て削除（重複防止）
  body = body.filter((ln) => !isUseClientLine(ln) && !isDynamicLine(ln) && !isRevalLine(ln));

  const out = [...head, "", ...body].join("\n").replace(/\n{3,}/g, "\n\n");
  fs.writeFileSync(f, out, "utf8");
  console.log("deduped:", f);
}
