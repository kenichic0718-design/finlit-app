'use client';

// app/settings/page.tsx
import dynamic from "next/dynamic";
import * as React from "react";

const CategoryManager = dynamic(() => import("@/components/CategoryManager"), { ssr: false });
const AuthStatus = dynamic(() => import("@/components/AuthStatus"), { ssr: false });

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">設定</h1>
        <AuthStatus />
      </div>
      <CategoryManager />
    </div>
  );
}

