export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from "react";
import HomeClient from "./_HomeClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  );
}
