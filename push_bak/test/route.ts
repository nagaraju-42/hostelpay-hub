import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { sendPushToUser } from '@/lib/push'
import type { ApiSuccess, ApiError } from '@/types'

export async function POST(_request: NextRequest) {
  const { user } = await getAuthSession()
  if (!user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendPushToUser(user.id, {
    title: '🔔 HostelPay Test',
    body: 'Push notifications are working! You will receive rent reminders here.',
    icon: '/icons/icon-192x192.png',
    url: '/dashboard',
    tag: 'test-notification',
  })

  if (result.sent === 0) {
    return NextResponse.json<ApiError>(
      { error: 'No active push subscriptions found. Please enable notifications first.' },
      { status: 404 }
    )
  }

  return NextResponse.json<ApiSuccess<typeof result>>({
    data: result,
    message: `Test notification sent to ${result.sent} device(s).`,
  })
}
