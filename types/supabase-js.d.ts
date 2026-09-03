// Minimal ambient type declarations for `@supabase/supabase-js`.
// The package is too large to fully type here, but this is enough for
// the surface used across the project: createClient, .from() chains,
// select/insert/update/eq/single, auth.getSession/signInWithPassword/signUp.

declare module "@supabase/supabase-js" {
  export interface SupabaseClient {
    from(table: string): any;
    auth: {
      getSession: () => Promise<{ data: { session: any }; error: any }>;
      getUser: () => Promise<{ data: { user: any }; error: any }>;
      signInWithPassword: (credentials: {
        email: string;
        password: string;
      }) => Promise<{ data: any; error: any }>;
      signUp: (credentials: {
        email: string;
        password: string;
        options?: { data?: Record<string, unknown> };
      }) => Promise<{ data: any; error: any }>;
      signOut: () => Promise<{ error: any }>;
      onAuthStateChange: (
        callback: (event: string, session: any) => void
      ) => { data: { subscription: { unsubscribe: () => void } } };
    };
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>
  ): SupabaseClient;

  export type { SupabaseClient };
}
