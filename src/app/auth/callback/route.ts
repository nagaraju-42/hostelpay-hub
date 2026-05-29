import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// ══════════════════════════════════════════════════════════════════════════
// GET /auth/callback
// Supabase OAuth redirect handler — exchanges the code for a session,
// then redirects the user to the appropriate page.
// ══════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/s'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // ── Silent Auto-Linking Flow ──────────────────────────────────────────
      // If the owner manually added the student, their user_id is null.
      // Auto-link them based on their Google email.
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email) {
        const { data: orphan } = await supabaseAdmin
          .from('students')
          .select('id')
          .eq('email', user.email)
          .is('user_id', null)
          .limit(1)
          .single()

        if (orphan) {
          await supabaseAdmin
            .from('students')
            .update({ user_id: user.id })
            .eq('id', orphan.id)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[/auth/callback] exchangeCodeForSession error:', error)
  }

  return NextResponse.redirect(`${origin}/s?error=auth_failed`)
}
