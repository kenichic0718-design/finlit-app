// app/auth/callback/page.tsx
import 'server-only';
import ClientPage from './ClientPage';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <ClientPage />;
}

