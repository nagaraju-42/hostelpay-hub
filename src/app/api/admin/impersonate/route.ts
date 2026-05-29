import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { owner_id } = await request.json()

  const cookieStore = await cookies()

  if (owner_id) {
    cookieStore.set('impersonate_owner_id', owner_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
    return NextResponse.json({ success: true, message: 'Impersonation started' })
  } else {
    // Stop impersonating
    cookieStore.delete('impersonate_owner_id')
    return NextResponse.json({ success: true, message: 'Impersonation stopped' })
  }
}
