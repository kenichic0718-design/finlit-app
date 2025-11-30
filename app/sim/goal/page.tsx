// app/sim/goal/page.tsx
import "server-only";
import Client from "./Client";

export default async function Page({ searchParams }: any) {
  return (
    <Client searchParams={searchParams as { prefill?: string } | undefined} />
  );
}
