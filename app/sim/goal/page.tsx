import 'server-only';
import Client from './Client';

export default async function Page({ searchParams }: { searchParams?: { prefill?: string } }) {
  return <Client searchParams={searchParams} />;
}

