import 'server-only'; 
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import React from 'react';
import ClientBoundary from './ClientBoundary';
export default function LoginPage() {
  // ここでは一切ブラウザAPIや use〇〇 を使わない
  return <ClientBoundary />;
}
