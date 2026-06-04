import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t')
  
  if (!token) {
    return new NextResponse('Missing login token', { status: 400 })
  }

  try {
    const secretStr = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || 'fallback-secret'
    const secret = new TextEncoder().encode(secretStr)
    const { payload } = await jwtVerify(token, secret)

    const email = payload.email as string
    if (!email) throw new Error('Invalid token payload')

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate Supabase token hash for magiclink
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email
    })

    if (error || !data.properties?.hashed_token) {
      console.error('Failed to generate secure token hash:', error)
      return new NextResponse('Internal error generating secure session. Please try again.', { status: 500 })
    }

    // Now securely log the user in on the server using the token hash
    const supabase = await createServerSupabaseClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: data.properties.hashed_token
    })

    if (verifyError) {
      console.error('Failed to verify OTP hash:', verifyError)
      return new NextResponse('Failed to establish secure session.', { status: 500 })
    }

    // Redirect the user to the dashboard - cookies are successfully set!
    const host = request.headers.get('x-forwarded-host') || request.nextUrl.host
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    return NextResponse.redirect(`${protocol}://${host}/dashboard`)
    
  } catch (error: any) {
    console.error('Magic link error:', error)
    if (error.code === 'ERR_JWT_EXPIRED') {
      return new NextResponse('This secure login link has expired (they are only valid for 10 minutes). Please ask the administrator to generate a new one.', { 
        status: 410,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    return new NextResponse('Invalid or corrupted login link.', { status: 400 })
  }
}
