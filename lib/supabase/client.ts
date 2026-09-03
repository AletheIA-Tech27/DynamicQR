import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client factory.
 *
 * Reads the public anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY) from the
 * environment, which is safe to embed in client-side code. Row-level
 * security (RLS) policies in the database are responsible for access
 * control — never trust the anon key alone for sensitive operations.
 *
 * For operations that must bypass RLS (e.g. an internal admin task), create
 * a separate server-side client using the `SUPABASE_SERVICE_ROLE_KEY` in a
 * server-only module and never expose it to the browser.
 */
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase environment variables are not configured. " +
        "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}

/**
 * Shared Supabase client singleton.
 *
 * Convenient for modules that only need a single shared instance. If you
 * need to create a separate client (e.g. with a different set of cookies
 * or auth context), call `createClient()` instead.
 */
export const supabase = createClient();

export type { SupabaseClient } from "@supabase/supabase-js";
