// app/api/logs/add/route.ts
import 'server-only';

// /api/logs の POST をそのまま再利用（ネットワーク経由にしない）
export { POST } from '../route';

// 誤ったメソッドは 405
export async function GET() {
  return new Response(JSON.stringify({ ok: false, error: 'Use POST /api/logs' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}

