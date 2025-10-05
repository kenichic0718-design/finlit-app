// components/LogoutButton.tsx
'use client';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LogoutButton() {
  return (
    <button
      className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
      onClick={async () => {
        await supabase.auth.signOut();
        location.href = '/login';
      }}
    >
      Sign out
    </button>
  );
}

