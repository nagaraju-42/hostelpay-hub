import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase/server'
import type { ApiSuccess, ApiError } from '@/types'
 
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
 
  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return NextResponse.json<ApiError>({ error: 'Forbidden.' }, { status: 403 })
  }
 
  let body: { email: string }
  try { body = await request.json() }
  catch { return NextResponse.json<ApiError>({ error: 'Invalid body.' }, { status: 400 }) }
 
  if (!body.email?.includes('@')) {
    return NextResponse.json<ApiError>({ error: 'Valid email is required.' }, { status: 400 })
  }
 
  // Generate a password recovery link via Supabase admin
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/login`
 
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: body.email.trim().toLowerCase(),
    options: { redirectTo },
  })
 
  if (error || !data) {
    return NextResponse.json<ApiError>({
      error: error?.message || 'Failed to generate reset link. Email may not be registered.'
    }, { status: 400 })
  }
 
  const resetLink = data.properties?.action_link || ''
 
  return NextResponse.json<ApiSuccess<{ reset_link: string; expires_in: string }>>({
    data: { reset_link: resetLink, expires_in: '24 hours' },
    message: 'Reset link generated. Send to user via WhatsApp.',
  })
}