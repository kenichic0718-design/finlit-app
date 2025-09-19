#!/bin/bash
set -e

# app 配下の .ts と .tsx を走査
{ find app -type f -name '*.ts'  -print0; \
  find app -type f -name '*.tsx' -print0; } \
| while IFS= read -r -d '' f; do
  perl -0777 -i -pe '
    s{
      (from\(\s*["\']logs["\']\s*\)\.insert\(\s*\[\s*\{\s*         # supabase.from("logs").insert([ { まで
      (?:(?!\}\s*\]\s*\)).)*?                                   # 閉じるまでの中身を最短で
      \bamount\s*:\s*)                                          # amount:
      (?!Math\.abs\()                                           # 既に包まれていないこと
      ([^,\}\n]+)                                               # 値の式
    }{$1 . "Math.abs(Number(" . $2 . "))"}gxs;
  ' "$f" && echo "patched: $f"
done
