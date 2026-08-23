import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Service-role client. Server only — never import this into a client component. */
export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — see .env.example",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Anon client, safe in the browser. Read-only by RLS. */
export function supabaseAnon() {
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — see .env.example",
    );
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const isSupabaseConfigured = Boolean(
  url && anonKey && process.env.SUPABASE_SERVICE_ROLE_KEY,
);
