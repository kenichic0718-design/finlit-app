import { execSync } from "node:child_process";
import fs from "node:fs";

const FILES = execSync('git ls-files "app/**/page.tsx"')
  .toString()
  .trim()
  .split("\n")
  .filter(Boolean);

const WANT = [
  "'use client';",
  "export const dynamic = 'force-dynamic';",
  "export const revalidate = 0;",
];

let bad = [];
for (const f of FILES) {
  if (!fs.existsSync(f)) continue;
  const txt = fs.readFileSync(f, "utf8")
    .replace(/\uFEFF/g, "")   // BOM
    .replace(/\u007F/g, "");  // DEL

  const lines = txt.split(/\r?\n/);
  const head = lines.slice(0, 3);
  const body = lines.slice(3).join("\n");

  const headerOk = head[0] === WANT[0] && head[1] === WANT[1] && head[2] === WANT[2];
  const hasUseClientInBody = /use client/.test(body);

  if (!headerOk || hasUseClientInBody) bad.push(f);
}

if (bad.length) {
  console.error("✖ Header violation in:\n" + bad.map(s => "  - " + s).join("\n"));
  process.exit(1);
} else {
  console.log("✔ headers OK");
}
