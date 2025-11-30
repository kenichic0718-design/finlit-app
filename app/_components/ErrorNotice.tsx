// app/_components/ErrorNotice.tsx
"use client";
import React from "react";

export default function ErrorNotice({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-red-600">
      {message}
    </p>
  );
}

