import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { ApiSuccess, ApiError } from '@/types'

// ══════════════════════════════════════════════════════════════════════════
// PATCH /api/students/[id]/approve
// Approves a pending student (sets approval_status to 'approved').
// ══════════════════════════════════════════════════════════════════════════
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthSession()
  const id = (await params).id

  if (!user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: student, error } = await supabase
    .from('students')
    .update({ approval_status: 'approved' })
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error || !student) {
    console.error('[PATCH /api/students/[id]/approve]', error)
    return NextResponse.json<ApiError>(
      { error: 'Failed to approve student.' },
      { status: 500 }
    )
  }

  // Notify student if they have user_id, but for now we just return success
  return NextResponse.json<ApiSuccess<null>>({ data: null, message: 'Student approved successfully.' })
}

// ══════════════════════════════════════════════════════════════════════════
// DELETE /api/students/[id]/approve
// Rejects a pending student (hard deletes the record).
// ══════════════════════════════════════════════════════════════════════════
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthSession()
  const id = (await params).id

  if (!user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  // Hard delete the row since they are rejected
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
    .eq('approval_status', 'pending')

  if (error) {
    console.error('[DELETE /api/students/[id]/approve]', error)
    return NextResponse.json<ApiError>(
      { error: 'Failed to reject student.' },
      { status: 500 }
    )
  }

  return NextResponse.json<ApiSuccess<null>>({ data: null, message: 'Student rejected.' })
}
