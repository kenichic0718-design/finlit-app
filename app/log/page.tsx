import 'server-only';
import LogList from './LogList';

export const dynamic = 'force-dynamic';

export default function LogPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">記録</h1>
      <LogList />
    </main>
  );
}
