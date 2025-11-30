// app/learn/stats/ClientBoundary.tsx
'use client';
import React from 'react';
import Client from './_PageClient';
export default function ClientBoundary(props: any) {
  return <Client {...props} />;
}
