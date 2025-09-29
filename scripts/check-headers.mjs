import { execSync } from "node:child_process";
import fs from "node:fs";

const serverPages = execSync('git ls-files "app/**/page.tsx"').toString().trim().split("\n").filter(Boolean);
const clientPages = execSync('git ls-files "app/**/_PageClient.tsx"').toString().trim().split("\n").filter(Boolean);

const WANT_DYNAMIC = "export const dynamic = 'force-dynamic';";
const WANT_REVALIDATE = "export const revalidate = 0;";

const isUseClientLine = (s) => /^\s*(['"`])use client\1\s*;?\s*$/.test(s);
const isDynamicLine   = (s) => /^\s*export\s+const\s+dynamic\s*=/.test(s);
const isRevalLine     = (s) => /^\s*export\s+const\s+revalidate\s*=/.test(s);

// --- server pages rule ---
let badServer = [];
for (const f of serverPages) {
  const txt = fs.readFileSync(f, "utf8").replace(/\uFEFF/g, "").replace(/\u007F/g, "");
  const lines = txt.split(/\r?\n/);
  const head5 = lines.slice(0, 5);

  const hasUseClientAnywhere = lines.some(isUseClientLine);
  const hasDynInHead = head5.some((l) => l.trim() === WANT_DYNAMIC);
  const hasRevInHead = head5.some((l) => l.trim() === WANT_REVALIDATE);

  if (hasUseClientAnywhere || !hasDynInHead || !hasRevInHead) badServer.push(f);
}

// --- client pages rule ---
let badClient = [];
for (const f of clientPages) {
  const txt = fs.readFileSync(f, "utf8").replace(/\uFEFF/g, "").replace(/\u007F/g, "");
  const lines = txt.split(/\r?\n/);
  const head = lines[0] || "";

  const okHead = isUseClientLine(head);
  const hasDynOrReval = lines.some((l) => isDynamicLine(l) || isRevalLine(l));

  if (!okHead || hasDynOrReval) badClient.push(f);
}

if (badServer.length || badClient.length) {
  if (badServer.length) {
    console.error("✖ Server page violations:"); for (const f of badServer) console.error("  - " + f);
  }
  if (badClient.length) {
    console.error("✖ Client page violations:"); for (const f of badClient) console.error("  - " + f);
  }
  process.exit(1);
} else {
  console.log("✔ headers OK (server/client rules)");
}
