import { execSync } from "node:child_process";
import fs from "node:fs";
const FILES = execSync('git ls-files "app/**/_PageClient.tsx"')
.toString().trim().split("\n").filter(Boolean);
const isUseClientLine = s => /^\s*(['"`])use client\1\s*;?\s*$/.test(s);
const isDynLine = s => /^\s*export\s+const\s+dynamic\s*=/.test(s);
const isRevLine = s => /^\s*export\s+const\s+revalidate\s*=/.test(s);
for (const f of FILES) {
let txt = fs.readFileSync(f, "utf8")
.replace(/^\uFEFF/, "")
.replace(/\u000D/g, "")
.replace(/\u007F/g, ""); 
let lines = txt.split("\n");
lines = lines.filter(l => !isUseClientLine(l) && !isDynLine(l) && !isRevLine(l));
const out = ["'use client';", "", ...lines].join("\n").replace(/\n{3,}/g, "\n\n");
fs.writeFileSync(f, out, "utf8");
console.log("cleaned:", f);
}
