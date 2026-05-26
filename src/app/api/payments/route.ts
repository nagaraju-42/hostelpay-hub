import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasPaidThisCycle, getCurrentCycleDueDate } from '@/lib/utils/due-calc'
import type { Payment, ApiSuccess, ApiError } from '@/types'
 
interface MarkPaidBody {
  student_id:   string
  amount_paid:  number
  payment_mode: 'cash' | 'upi' | 'bank'
  notes?:       string
}
 
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
 
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
 
  let body: MarkPaidBody
  try { body = await request.json() }
  catch { return NextResponse.json<ApiError>({ error: 'Invalid request body.' }, { status: 400 }) }
 
  // ── Validate required fields ────────────────────────────────────────────
  if (!body.student_id) {
    return NextResponse.json<ApiError>({ error: 'student_id is required.' }, { status: 400 })
  }
  if (!body.amount_paid || body.amount_paid <= 0) {
    return NextResponse.json<ApiError>({ error: 'Amount must be greater than zero.' }, { status: 400 })
  }
  if (!['cash', 'upi', 'bank'].includes(body.payment_mode)) {
    return NextResponse.json<ApiError>({ error: 'Payment mode must be cash, upi, or bank.' }, { status: 400 })
  }
 
  // ── Verify student belongs to this owner (RLS + explicit check) ─────────
  const { data: student, error: studErr } = await supabase
    .from('students')
    .select('id, owner_id, monthly_due_day, rent_amount, full_name')
    .eq('id', body.student_id)
    .single()
 
  if (studErr || !student) {
    return NextResponse.json<ApiError>({ error: 'Student not found.' }, { status: 404 })
  }
  if (student.owner_id !== user.id) {
    return NextResponse.json<ApiError>({ error: 'Forbidden.' }, { status: 403 })
  }
 
  // ── Check for duplicate payment this cycle ──────────────────────────────
  const today = new Date()
  const thirtyTwoDaysAgo = new Date(today)
  thirtyTwoDaysAgo.setDate(today.getDate() - 32)
 
  const { data: existingPayments } = await supabase
    .from('payments')
    // .select('id, paid_at')
    .select('*')
    .eq('student_id', body.student_id)
    .gte('paid_at', thirtyTwoDaysAgo.toISOString())
 
  if (hasPaidThisCycle(student.monthly_due_day, existingPayments || [], today)) {
    return NextResponse.json<ApiError>({
      error: `${student.full_name} has already paid for this cycle.`
    }, { status: 409 })
  }
 
  // ── Determine the due_date this payment covers ──────────────────────────
  const dueDate = getCurrentCycleDueDate(student.monthly_due_day, today)
 
  // ── Insert payment record ───────────────────────────────────────────────
  const { data: newPayment, error: insertErr } = await supabase
    .from('payments')
    .insert({
      student_id:   body.student_id,
      owner_id:     user.id,
      amount_paid:  body.amount_paid,
      payment_mode: body.payment_mode,
      due_date:     dueDate.toISOString().split('T')[0],
      notes:        body.notes?.trim() || null,
      paid_at:      new Date().toISOString(),
    })
    .select()
    .single()
 
  if (insertErr || !newPayment) {
    console.error('[POST /api/payments]', insertErr)
    return NextResponse.json<ApiError>({ error: 'Failed to record payment.' }, { status: 500 })
  }
 
  return NextResponse.json<ApiSuccess<Payment>>(
    { data: newPayment, message: `Payment recorded for ${student.full_name}.` },
    { status: 201 }
  )
}