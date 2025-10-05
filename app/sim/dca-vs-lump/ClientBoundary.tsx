import 'server-only';
import React from 'react';
import dynamic from 'next/dynamic';
const Client = dynamic(() => import('./_PageClient'), { ssr: false });
export default function ClientBoundary(props: any) {
  return <Client {...props} />;
}
