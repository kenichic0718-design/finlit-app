import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Route HandlerやServer Actionから使うSupabaseクライアント。
 * ここでは cookie の set/remove が許可されています（Nextの制約OKな領域）
 */
export function getSupabaseRoute(): SupabaseClient {
  return createRouteHandlerClient({ cookies });
}

