"use client";
// app/page.tsx
import { Suspense } from "react";
import HomeClient from "./_HomeClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  );
}

