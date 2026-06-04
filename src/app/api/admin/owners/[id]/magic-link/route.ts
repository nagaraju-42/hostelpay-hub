import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const ownerId = resolvedParams.id

    // Get the owner's email from Auth Admin
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: ownerUser, error: ownerError } = await adminClient.auth.admin.getUserById(ownerId)
    if (ownerError || !ownerUser.user) {
      return NextResponse.json({ error: 'Failed to find owner auth record.' }, { status: 404 })
    }

    const email = ownerUser.user.email
    if (!email) {
      return NextResponse.json({ error: 'Owner does not have an email address.' }, { status: 400 })
    }

    // Create JWT with exactly 10 minutes expiration
    const secretStr = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || 'fallback-secret'
    const secret = new TextEncoder().encode(secretStr)
    const token = await new SignJWT({ ownerId, email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m') // Enforce 10 min expiration
      .sign(secret)

    // Construct magic link URL
    // Use x-forwarded-host if available (useful behind proxies/Vercel)
    const host = request.headers.get('x-forwarded-host') || request.nextUrl.host
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const magicLink = `${protocol}://${host}/api/auth/magic?t=${token}`

    return NextResponse.json({ success: true, magicLink })
  } catch (error: any) {
    console.error('Magic link generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
