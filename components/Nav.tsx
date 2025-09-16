'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/learn",     label: "学ぶ" },
  { href: "/log",       label: "記録" },
  { href: "/goal",      label: "目標" },
  { href: "/budgets",   label: "予算" },
];

export default function Nav(){
  const path = usePathname();
  return (
    <nav className="flex gap-1 flex-wrap">
      {tabs.map(t=>{
        const active = path?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={
              "px-3 py-1.5 rounded-lg text-sm border transition " +
              (active
                ? "bg-brand text-black border-brand/40"
                : "bg-panel border-line hover:bg-panel/80")
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

