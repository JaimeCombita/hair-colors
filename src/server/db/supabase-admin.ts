import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/server/env";

let client: SupabaseClient | undefined;

/** Cliente con service role: salta RLS. Solo para código de servidor. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    const env = getServerEnv();
    client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
