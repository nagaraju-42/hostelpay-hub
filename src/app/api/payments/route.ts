import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { getCurrentCycleDueDate, getTodayIST } from '@/lib/utils/due-calc'
import type { Payment, ApiSuccess, ApiError } from '@/types'

// ══════════════════════════════════════════════════════════════════════════
// GET /api/payments
// Returns recent payments for this owner, optionally limited via ?limit=N
// Joins student name + room for display in Recent Payments / History views.
// ══════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthSession()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })

  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '50')

  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      *,
      students!inner(full_name, room_number)
    `)
    .eq('owner_id', user.id)
    .order('paid_at', { ascending: false })
    .limit(isNaN(limit) ? 50 : Math.min(limit, 200))

  if (error) {
    console.error('[GET /api/payments]', error)
    return NextResponse.json<ApiError>({ error: 'Failed to fetch payments.' }, { status: 500 })
  }

  // Flatten student fields to top level
  const flat = (payments ?? []).map((p: any) => ({
    ...p,
    student_name: p.students?.full_name  ?? '',
    room_number:  p.students?.room_number ?? '',
    students:     undefined,
  }))

  return NextResponse.json<ApiSuccess<typeof flat>>({ data: flat })
}


interface MarkPaidBody {
  student_id:   string
  amount_paid:  number
  payment_mode: 'cash' | 'upi' | 'bank'
  notes?:       string
}
 
export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthSession()
 
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
    .eq('owner_id', user.id)
    .single()
 
  if (studErr || !student) {
    return NextResponse.json<ApiError>({ error: 'Student not found.' }, { status: 404 })
  }
  if (student.owner_id !== user.id) {
    return NextResponse.json<ApiError>({ error: 'Forbidden.' }, { status: 403 })
  }
 
  // ── Check for duplicate payment (double-click prevention) ───────────────
  const today = getTodayIST()
  const fiveMinutesAgo = new Date(today.getTime() - 5 * 60000)
 
  const { data: existingPayments } = await supabase
    .from('payments')
    .select('id')
    .eq('student_id', body.student_id)
    .eq('amount_paid', body.amount_paid)
    .gte('paid_at', fiveMinutesAgo.toISOString())
 
  if (existingPayments && existingPayments.length > 0) {
    return NextResponse.json<ApiError>({
      error: `A payment of ₹${body.amount_paid} was already recorded for ${student.full_name} a few minutes ago. Please avoid double-clicking.`
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
      paid_at:      today.toISOString(),
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