import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { resolveStudentId } from '@/lib/auth-student'
import type { Payment, ApiSuccess, ApiError } from '@/types'

// ══════════════════════════════════════════════════════════════════════════
// GET /api/student/payments
// Returns the authenticated student's full payment history, newest first.
// ══════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  const { studentId, isAuthenticated } = await resolveStudentId(request)
  
  if (!isAuthenticated) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!studentId) {
    return NextResponse.json<ApiError>({ error: 'Not found' }, { status: 404 })
  }

  // ── 3. Fetch payments ──────────────────────────────────────────────────
  const { data: payments, error: paymentsError } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('student_id', studentId)
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
