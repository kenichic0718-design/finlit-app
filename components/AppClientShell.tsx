// components/AppClientShell.tsx
'use client';
import React, { Suspense } from 'react';
import AuthUrlHandler from '@/components/AuthUrlHandler';
import AuthBootstrap from '@/components/AuthBootstrap';

export default function AppClientShell() {
  return (
    <Suspense fallback={null}>
      <AuthUrlHandler />
      <AuthBootstrap />
    </Suspense>
  );
}

