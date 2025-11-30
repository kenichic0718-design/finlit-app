"use client";

import { useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function useBoot() {
  useEffect(() => {
    // 起動時にセッションを触って Cookie を最新化（PKCE/SSO混在時の安定化）
    const sb = createClientComponentClient({ options: { auth: { flowType: "pkce" } } });
    sb.auth.getSession().catch(() => {});
  }, []);
}

