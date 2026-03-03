import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Enhanced cookie options for iOS PWA persistence
            const enhancedOptions = {
              ...options,
              secure: true,
              sameSite: 'lax' as const,
              path: '/',
              maxAge: 60 * 60 * 24 * 365, // 1 year
            }
            cookieStore.set({ name, value, ...enhancedOptions })
          } catch {
            // Called from a Server Component — middleware handles session refresh
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            const enhancedOptions = {
              ...options,
              secure: true,
              sameSite: 'lax' as const,
              path: '/',
            }
            cookieStore.set({ name, value: '', ...enhancedOptions })
          } catch {
            // Called from a Server Component — middleware handles session refresh
          }
        },
      },
    }
  )
}
