import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
 
// ── Session-Aware Server Client ─────────────────────────────────────────
// USE THIS in: API routes that need to know WHO is making the request.
// Reads the auth session from the incoming request cookies.
// RLS policies apply — owner only sees their own data.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component — ignore */ }
        },
      },
    }
  )
}
 
// ── Admin Client (bypasses RLS) ─────────────────────────────────────────
// USE THIS ONLY in: /api/admin/* routes (Super Admin operations only).
// NEVER import this in a React component or non-admin API route.
// This key has full read/write access to ALL data in all tables.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)