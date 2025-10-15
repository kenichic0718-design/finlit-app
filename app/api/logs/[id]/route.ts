import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function makeSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
        setAll: (c) => {
          c.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
}

export async function PUT(req: NextRequest, props: { params: { id: string } }) {
  const id = Number(props.params.id);
  if (!Number.isFinite(id)) {
    return Response.json({ ok: false, error: 'Invalid id' }, { status: 400 });
  }

  const supabase = makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, any> = {};
  if (typeof body.amount === 'number') patch.amount = body.amount;
  if (typeof body.memo === 'string') patch.memo = body.memo;

  if (Object.keys(patch).length === 0) {
    return Response.json({ ok: false, error: 'No fields to update' }, { status: 400 });
  }

  const { error } = await supabase
    .from('logs')
    .update(patch)
    .eq('id', id)
    .eq('profile_id', user.id);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, props: { params: { id: string } }) {
  const id = Number(props.params.id);
  if (!Number.isFinite(id)) {
    return Response.json({ ok: false, error: 'Invalid id' }, { status: 400 });
  }

  const supabase = makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('logs')
    .delete()
    .eq('id', id)
    .eq('profile_id', user.id);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
