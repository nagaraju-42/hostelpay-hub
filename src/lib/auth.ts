import { cookies } from 'next/headers'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase/server'

/**
 * Enhanced auth session getter that handles Super Admin impersonation.
 * 
 * If the logged-in user is a super admin AND the `impersonate_owner_id` cookie is present,
 * it returns `supabaseAdmin` to bypass RLS, and sets the `user.id` to the impersonated owner ID.
 * 
 * IMPORTANT: Because this returns `supabaseAdmin`, ALL subsequent queries MUST explicitly
 * filter by `.eq('owner_id', user.id)` to prevent cross-hostel data leakage.
 */
export async function getAuthSession() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, supabase, isImpersonating: false }
  }

  // Check if current user is super admin
  if (user.email === process.env.SUPER_ADMIN_EMAIL) {
    const cookieStore = await cookies()
    const impersonateId = cookieStore.get('impersonate_owner_id')?.value

    if (impersonateId) {
      // Return elevated admin client and overwrite user ID
      return {
        user: { ...user, id: impersonateId },
        supabase: supabaseAdmin,
        isImpersonating: true
      }
    }
  }

  return { user, supabase, isImpersonating: false }
}
