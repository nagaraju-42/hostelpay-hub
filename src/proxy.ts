import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
 
// ════════════════════════════════════════════════════════════════════════
// ROUTE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════
const PROTECTED_OWNER_ROUTES = ['/dashboard']
const PROTECTED_STUDENT_ROUTES = ['/s']
const ADMIN_ROUTES      = ['/admin']
const PUBLIC_ROUTES     = ['/login', '/reset-password', '/', '/qr', '/auth/callback']
 
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
 
  // ── OAUTH FALLBACK ──────────────────────────────────────────────────────
  // If Supabase's Redirect URIs are misconfigured, it might redirect to the
  // Site URL (e.g. '/' or '/login') instead of '/auth/callback'.
  // This catches the OAuth code and forwards it to the correct handler.
  if (searchParams.has('code') && pathname !== '/auth/callback') {
    const callbackUrl = new URL('/auth/callback', request.url)
    searchParams.forEach((value, key) => callbackUrl.searchParams.set(key, value))
    return NextResponse.redirect(callbackUrl)
  }
 
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
 
  // ── RULE 1: Protect /dashboard (owner) routes ─────────────────────────
  const isOwnerRoute = PROTECTED_OWNER_ROUTES.some(r => pathname.startsWith(r))
  if (isOwnerRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── RULE 2: Protect /s (student) routes ───────────────────────────────
  const isStudentRoute = pathname === '/s' || pathname.startsWith('/s/')
  if (isStudentRoute && pathname !== '/s' && !user) {
    // Check for custom phone-login JWT cookie
    const hasCustomSession = request.cookies.has('hostel_student_session')
    if (!hasCustomSession) {
      const loginUrl = new URL('/s', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── RULE 3: Protect /admin routes ─────────────────────────────────────
  const isAdmin = ADMIN_ROUTES.some(r => pathname.startsWith(r))
  if (isAdmin) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (user.email !== process.env.SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ── RULE 4: Redirect logged-in owners away from /login ────────────────
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