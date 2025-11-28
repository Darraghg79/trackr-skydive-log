import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Enhance cookie options for iOS PWA persistence
          const enhancedOptions = {
            ...options,
            secure: true,
            sameSite: 'lax' as const,
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
          }
          request.cookies.set({ name, value, ...enhancedOptions })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...enhancedOptions })
        },
        remove(name: string, options: CookieOptions) {
          const enhancedOptions = {
            ...options,
            secure: true,
            sameSite: 'lax' as const,
            path: '/',
          }
          request.cookies.set({ name, value: '', ...enhancedOptions })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...enhancedOptions })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Define protected routes (all dashboard pages)
  const protectedRoutes = [
    '/jumps',
    '/home',
    '/reports',
    '/invoices',
    '/dropzones',
    '/aircraft',
    '/gear',
    '/rigs',
    '/jump-types',
    '/settings',
  ]

  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Protect dashboard routes - redirect to login if not authenticated
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/jumps', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
