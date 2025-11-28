import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
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
      cookieOptions: {
        // Ensure cookies work across PWA sessions
        secure: true,
        sameSite: 'lax',
      }
    }
  )
}
