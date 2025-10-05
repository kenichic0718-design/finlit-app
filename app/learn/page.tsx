import 'server-only';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import { unstable_noStore as noStore } from "next/cache";
import ClientBoundary from './ClientBoundary';

export default function Page() {
    noStore();
return (
    <Suspense fallback={null}>
      <ClientBoundary />
    </Suspense>
  );
}
