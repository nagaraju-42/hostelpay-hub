import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import type { ApiSuccess, ApiError } from '@/types'

// ══════════════════════════════════════════════════════════════════════════
// DELETE /api/payments/[id]
// Allows owner to delete a mistakenly added payment.
// ══════════════════════════════════════════════════════════════════════════
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user } = await getAuthSession()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })

  // We use supabaseAdmin to bypass RLS for deletion since we will manually check owner_id
  const { supabaseAdmin } = await import('@/lib/supabase/server')

  // 1. Fetch payment to verify ownership and grab details for audit log
  const { data: payment, error: fetchErr } = await supabaseAdmin
    .from('payments')
    .select('*, students(full_name, room_number)')
    .eq('id', id)
    .single()

  if (fetchErr || !payment) {
    return NextResponse.json<ApiError>({ error: 'Payment not found.' }, { status: 404 })
  }

  // 2. Security Check
  if (payment.owner_id !== user.id) {
    return NextResponse.json<ApiError>({ error: 'Forbidden.' }, { status: 403 })
  }

  // 3. Create Audit Log (Stored in notifications for Super Admin)
  await supabaseAdmin.from('notifications').insert({
    owner_id: user.id, // we tie it to the owner, but super admin can see all
    student_id: payment.student_id,
    type: 'audit_payment_deleted',
    message: `Payment of ₹${payment.amount_paid} for ${payment.students?.full_name || 'Student'} (Room ${payment.students?.room_number || '?'}) was deleted.`,
    is_read: true, // Auto-read so it doesn't bother the owner
    meta: {
      action: 'delete_payment',
      deleted_by: user.id,
      amount: payment.amount_paid,
      payment_mode: payment.payment_mode,
      paid_at: payment.paid_at,
      student_name: payment.students?.full_name,
      room_number: payment.students?.room_number
    }
  })

  // 4. Actually Hard Delete the payment
  const { error } = await supabaseAdmin
    .from('payments')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) {
    console.error('[DELETE /api/payments/[id]]', error)
    return NextResponse.json<ApiError>({ error: 'Failed to delete payment.' }, { status: 500 })
  }

  return NextResponse.json<ApiSuccess<null>>({ data: null, message: 'Payment deleted successfully.' })
}
