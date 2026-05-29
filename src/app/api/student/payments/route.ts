import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Payment, ApiSuccess, ApiError } from '@/types'

// ══════════════════════════════════════════════════════════════════════════
// GET /api/student/payments
// Returns the authenticated student's full payment history, newest first.
// ══════════════════════════════════════════════════════════════════════════
export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  // ── 1. Auth check ──────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Resolve student record ──────────────────────────────────────────
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, owner_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (studentError || !student) {
    return NextResponse.json<ApiError>(
      { error: 'No student profile found. Please join a hostel first.' },
      { status: 404 }
    )
  }

  // ── 3. Fetch payments ──────────────────────────────────────────────────
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', student.id)
    .order('paid_at', { ascending: false })

  if (paymentsError) {
    console.error('[GET /api/student/payments]', paymentsError)
    return NextResponse.json<ApiError>(
      { error: 'Failed to fetch payments. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json<ApiSuccess<Payment[]>>({ data: payments ?? [] })
}
