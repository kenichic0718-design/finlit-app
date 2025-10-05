import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
const IGNORE_GLOBS = [
  'finlit-chat-pack/',
  'diff.patch',
  '.next/',
  'node_modules/',
  // 追加で除外したいパスがあればここへ
];
const MAX_READ = 200;
function globsIgnore(file) {
  return IGNORE_GLOBS.some((g) => file.startsWith(g));
}
function readHead(fp) {
  try {
    const s = fs.readFileSync(fp, 'utf8');
    return s.slice(0, MAX_READ);
  } catch {
    return '';
  }
}
function hasUseClientHead(textHead) {
  // 先頭付近の "use client" を検出
  return /["']use client["']/.test(textHead.split('\n').slice(0, 5).join('\n'));
}
function hasServerOnlyImportHead(textHead) {
  // 先頭付近に import 'server-only' があるか
  return /import\s+['"]server-only['"]\s*;?/.test(textHead.split('\n').slice(0, 10).join('\n'));
}
function listGitFiles(pattern) {
  const out = execSync(`git ls-files "${pattern}"`, { stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
  return out ? out.split('\n').filter(Boolean) : [];
}
function resolveImport(fromFile, spec) {
  // 相対パスのみ対象（node_modules は対象外）
  if (!spec.startsWith('.') && !spec.startsWith('/')) return null;
  const base = path.dirname(fromFile);
  const cand = [
    path.resolve(base, `${spec}.tsx`),
    path.resolve(base, `${spec}.ts`),
    path.resolve(base, `${spec}/index.tsx`),
    path.resolve(base, `${spec}/index.ts`),
  ];
  for (const c of cand) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}
function extractImports(src) {
  // 極力シンプルな import 検出（ESLint/AST までは使わない）
  const imps = [];
  const re = /^\s*import\s+(?:[^'"]+from\s+)?['"]([^'"]+)['"]/gm;
  let m;
  while ((m = re.exec(src))) {
    imps.push(m[1]);
  }
  return imps;
}
const serverPages = listGitFiles('app/**/page.tsx').filter((f) => !globsIgnore(f));
const badServer = new Set();
const reasons = new Map(); // file -> reason[]
for (const f of serverPages) {
  const head = readHead(f);
  const fileReasons = [];

  // 1) use client 禁止
  if (hasUseClientHead(head)) {
    fileReasons.push("contains 'use client' in server page");
  }

  // 2) server-only 必須
  if (!hasServerOnlyImportHead(head)) {
    fileReasons.push("missing `import 'server-only';` at top");
  }

  // 3) 直 import している先が client でないか
  try {
    const full = fs.readFileSync(f, 'utf8');
    const specs = extractImports(full);
    for (const s of specs) {
      const resolved = resolveImport(f, s);
      if (!resolved) continue;
      const impHead = readHead(resolved);
      if (hasUseClientHead(impHead) && require("path").basename(resolved) !== "ClientBoundary.tsx") {
        fileReasons.push(`imports client module (${s}) directly`);
      }
    }
  } catch {
    // 読めない場合はスキップ
  }

  if (fileReasons.length) {
    badServer.add(f);
    reasons.set(f, fileReasons);
  }
}
if (badServer.size > 0) {
  console.error("✖ Server page violations:");
  for (const f of badServer) {
    const r = reasons.get(f) || [];
    for (const line of r) {
      console.error(`  - ${f}: ${line}`);
    }
  }
  process.exit(1);
}
console.log("✔ headers OK (server/client rules)");
