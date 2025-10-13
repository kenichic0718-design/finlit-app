// app/auth/callback/page.tsx
import 'server-only';
import ClientPage from './ClientPage';

export const dynamic = 'force-dynamic';

export default function Page() {
  // サーバーでは何もせず、クライアント側で処理
  return <ClientPage />;
}

