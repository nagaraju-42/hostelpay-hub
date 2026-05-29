import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase/server'
import type { Notification, ApiSuccess, ApiError } from '@/types'

// ══════════════════════════════════════════════════════════════════════════
// GET /api/notifications
// Returns the 20 most recent notifications for the authenticated owner,
// joined with the student's name, room number, and phone.
// ══════════════════════════════════════════════════════════════════════════
export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: notifications, error } = await supabaseAdmin
    .from('notifications')
    .select('*, students!left(full_name, room_number, phone)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[GET /api/notifications]', error)
    return NextResponse.json<ApiError>(
      { error: 'Failed to fetch notifications.' },
      { status: 500 }
    )
  }

  // Reshape: promote `students` join into `student` field matching the Notification type
  const shaped: Notification[] = (notifications ?? []).map((n) => {
    const { students, ...rest } = n as typeof n & {
      students: { full_name: string; room_number: string; phone: string } | null
    }
    return {
      ...rest,
      student: students ?? null,
    } as Notification
  })

  return NextResponse.json<ApiSuccess<Notification[]>>({ data: shaped })
}

// ══════════════════════════════════════════════════════════════════════════
// PATCH /api/notifications
// Marks one or more notifications as read.
// Body: { ids: string[] }
// ══════════════════════════════════════════════════════════════════════════
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { ids: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiError>({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { ids } = body

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json<ApiError>(
      { error: 'ids must be a non-empty array of notification IDs.' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .in('id', ids)
    .eq('owner_id', user.id) // RLS bypass, but explicit eq ensures safety

  if (error) {
    console.error('[PATCH /api/notifications]', error)
    return NextResponse.json<ApiError>(
      { error: 'Failed to mark notifications as read.' },
      { status: 500 }
    )
  }

  return NextResponse.json<ApiSuccess<null>>(
    { data: null, message: 'Marked as read.' }
  )
}
