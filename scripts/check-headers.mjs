import fs from "node:fs";

const FILES = [
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

const useClientRe = /(^|\n)\s*(['"`])use client\2\s*;?\s*($|\n)/g;

let bad = [];
for (const f of FILES) {
  if (!fs.existsSync(f)) continue;
  const txt = fs.readFileSync(f, "utf8").replace(/\uFEFF/g, "").replace(/\u007F/g, "");
  const lines = txt.split(/\r?\n/);
  const head = lines.slice(0, 3);

  const headerOk = head[0] === WANT[0] && head[1] === WANT[1] && head[2] === WANT[2];
  const rest = lines.slice(3).join("\n");

  // 先頭以外に 'use client' が出てこないこと
  const hasUseClientInBody = useClientRe.test("\n" + rest + "\n");

  if (!headerOk || hasUseClientInBody) bad.push(f);
}

if (bad.length) {
  console.error("✖ Header violation in:\n" + bad.map(s => "  - " + s).join("\n"));
  process.exit(1);
} else {
  console.log("✔ headers OK");
}
