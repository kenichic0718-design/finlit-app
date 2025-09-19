#!/usr/bin/env perl
use strict; use warnings;
local $/ = undef;
while (my $f = shift @ARGV) {
  open my $in, '<', $f or die "$f: $!";
  my $src = do { local $/; <$in> };
  my $count = ($src =~ s{
    (from\(\s*["']logs["']\s*\)\.insert\(\s*(?:\[\s*)?\{\s*   # insert のオブジェクト開始～
      (?:(?!\}\s*(?:\]\s*)?\)).)*?                           # 終端まで最短一致
      \bamount\s*:\s*)                                       # amount:
    (?!Math\.abs\()                                          # 既に包まれていなければ
    ([^,}\n]+)                                               # 値の式
  }{$1."Math.abs(Number(".$2."))"}gxs);
  if ($count) {
    open my $out, '>', $f or die "$f: $!";
    print $out $src;
    print "patched: $f ($count)\n";
  }
}
