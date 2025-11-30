'use client';

import { createContext, useContext, useMemo } from 'react';
import { createSupabaseBrowser } from '../_utils/createSupabaseBrowser';

type Ctx = ReturnType<typeof createSupabaseBrowser>;
const SupabaseCtx = createContext<Ctx | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => createSupabaseBrowser(), []);
  return <SupabaseCtx.Provider value={client}>{children}</SupabaseCtx.Provider>;
}

export function useSupabase() {
  const v = useContext(SupabaseCtx);
  if (!v) throw new Error('SupabaseProvider is missing');
  return v;
}

