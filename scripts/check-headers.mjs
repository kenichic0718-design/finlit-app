import { execSync } from "node:child_process";
import fs from "node:fs";

// サーバーページとクライアントページをそれぞれ収集
const PAGES  = execSync('git ls-files "app/**/page.tsx"').toString().trim().split("\n").filter(Boolean);
const CLIENTS = execSync('git ls-files "app/**/_PageClient.tsx"').toString().trim().split("\n").filter(Boolean);

// 期待ヘッダー（サーバー page.tsx 側）
const WANT_PAGE = [
  "export const dynamic = 'force-dynamic';",
  "export const revalidate = 0;",
];

const isUseClientLine = (s) => /^\s*(['"`])use client\1\s*;?\s*$/.test(s);
const hasDynLine = (s) => /^\s*export\s+const\s+dynamic\s*=/.test(s);
const hasRevLine = (s) => /^\s*export\s+const\s+revalidate\s*=/.test(s);

let bad = [];

// 1) server page.tsx の検査：先頭2行が WANT_PAGE、かつ本文に 'use client' が無い
for (const f of PAGES) {
  const txt = fs.readFileSync(f, "utf8").replace(/\uFEFF/g, "").replace(/\u007F/g, "");
  const lines = txt.split(/\r?\n/);
  const head = lines.slice(0, 2);
  const body = lines.slice(2).join("\n");

  const okHead = head[0] === WANT_PAGE[0] && head[1] === WANT_PAGE[1];
  const hasUseClientAnywhere = /use client/.test(txt);

  if (!okHead || hasUseClientAnywhere) {
    bad.push(`${f} (server header invalid or contains 'use client')`);
  }
}

// 2) _PageClient.tsx の検査：先頭の有効行が 'use client'、かつ dynamic/revalidate を含まない
for (const f of CLIENTS) {
  const txt = fs.readFileSync(f, "utf8").replace(/\uFEFF/g, "").replace(/\u007F/g, "");
  const lines = txt.split(/\r?\n/);

  // 最初の非空行
  const firstMeaningful = lines.find((l) => l.trim().length > 0) ?? "";
  const firstIsUseClient = isUseClientLine(firstMeaningful);

  // 本文に dynamic/revalidate が紛れ込んでないこと
  const hasDyn = hasDynLine(txt);
  const hasRev = hasRevLine(txt);

  if (!firstIsUseClient || hasDyn || hasRev) {
    bad.push(`${f} (client header invalid or contains dynamic/revalidate)`);
  }
}

if (bad.length) {
  console.error("✖ Header violation:\n" + bad.map((s) => "  - " + s).join("\n"));
  process.exit(1);
} else {
  console.log("✔ headers OK (server pages & _PageClient.tsx)");
}
