import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use localStorage for persistent sessions on PWAs
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'trackr-auth',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )
}
