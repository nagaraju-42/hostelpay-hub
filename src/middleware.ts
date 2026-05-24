import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
 
// ════════════════════════════════════════════════════════════════════════
// ROUTE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════
const PROTECTED_ROUTES  = ['/dashboard', '/students', '/export']
const ADMIN_ROUTES      = ['/admin']
const PUBLIC_ROUTES     = ['/login', '/reset-password', '/']
 
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
 
  // ── Create a response object we can modify (to set cookies) ──
  let supabaseResponse = NextResponse.next({ request })
 
  // ── Create session-aware Supabase client ─────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
 
  // ── IMPORTANT: Always call getUser() to refresh expired tokens ──
  const { data: { user } } = await supabase.auth.getUser()
 
  // ── RULE 1: Protect /dashboard and related routes ─────────────
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
 
  // ── RULE 2: Protect /admin routes ─────────────────────────────
  const isAdmin = ADMIN_ROUTES.some(r => pathname.startsWith(r))
  if (isAdmin) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (user.email !== process.env.SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
 
  // ── RULE 3: Redirect logged-in users away from /login ─────────
  if (pathname === '/login' && user) {
    if (user.email === process.env.SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
 
  return supabaseResponse
}
 
// ════════════════════════════════════════════════════════════════════════
// MATCHER — which routes middleware runs on
// Excludes static files and _next internals for performance
// ════════════════════════════════════════════════════════════════════════
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}