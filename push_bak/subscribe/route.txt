import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { ApiSuccess, ApiError } from '@/types'

export async function POST(request: NextRequest) {
  const { user } = await getAuthSession()
  if (!user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { subscription: PushSubscriptionJSON }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiError>({ error: 'Invalid body' }, { status: 400 })
  }

  const { subscription } = body
  if (!subscription?.endpoint || !subscription?.keys) {
    return NextResponse.json<ApiError>({ error: 'Invalid subscription object' }, { status: 400 })
  }

  // Upsert — if endpoint already exists, update keys
  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh!,
        auth: subscription.keys.auth!,
        user_agent: request.headers.get('user-agent') || null,
      },
      { onConflict: 'endpoint' }
    )

  if (error) {
    console.error('[POST /api/push/subscribe]', error)
    return NextResponse.json<ApiError>({ error: 'Failed to save subscription' }, { status: 500 })
  }

  return NextResponse.json<ApiSuccess<null>>({ data: null, message: 'Subscribed to push notifications.' })
}

export async function DELETE(request: NextRequest) {
  const { user } = await getAuthSession()
  if (!user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { endpoint: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiError>({ error: 'Invalid body' }, { status: 400 })
  }

  await supabaseAdmin
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', body.endpoint)

  return NextResponse.json<ApiSuccess<null>>({ data: null, message: 'Unsubscribed.' })
}
