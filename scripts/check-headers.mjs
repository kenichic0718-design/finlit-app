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

let bad = [];
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const txt = fs.readFileSync(f, "utf8").replace(/\u007F/g, "");
  const first = txt.split(/\r?\n/).slice(0, 4);
  if (!(first[0] === WANT[0] && first[1] === WANT[1] && first[2] === WANT[2])) {
    bad.push(f);
  }
}
if (bad.length) {
  console.error("✖ Header not normalized in:\n" + bad.map(s => "  - " + s).join("\n"));
  process.exit(1);
}
