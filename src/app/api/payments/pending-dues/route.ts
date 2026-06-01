import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { calculateMonthsUnpaid, getPaymentStatus } from '@/lib/utils/due-calc'
import type { ApiSuccess, ApiError, Payment } from '@/types'

// ══════════════════════════════════════════════════════════════════════════
// GET /api/payments/pending-dues
// Returns ALL active students with their pending dues information:
//   - How many months they owe
//   - Total amount owed (cumulative)
//   - Last payment date
//   - Days since last payment
//   - Contact info (phone, parent_phone)
// Sorted by most owed first (descending total_owed).
// ══════════════════════════════════════════════════════════════════════════

export interface PendingDueStudent {
  id:               string
  full_name:        string
  phone:            string
  parent_phone:     string | null
  room_number:      string
  rent_amount:      number
  monthly_due_day:  number
  months_unpaid:    number      // count of missed cycles
  total_owed:       number      // cumulative amount owed
  last_paid_at:     string | null
  days_since_payment: number | null
  status:           'overdue' | 'due_today' | 'upcoming' | 'paid'
}

export async function GET(_request: NextRequest) {
  const { supabase, user } = await getAuthSession()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })

  // 1. Fetch all active students
  const { data: students, error: studErr } = await supabase
    .from('students')
    .select('id, full_name, phone, parent_phone, room_number, rent_amount, monthly_due_day, date_of_joining')
    .eq('owner_id', user.id)
    .eq('is_active', true)
    .order('full_name')

  if (studErr || !students) {
    return NextResponse.json<ApiError>({ error: 'Failed to fetch students.' }, { status: 500 })
  }

  if (students.length === 0) {
    return NextResponse.json<ApiSuccess<PendingDueStudent[]>>({ data: [] })
  }

  // 2. Fetch ALL payments for these students (last 12 months to calculate multi-month dues)
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const { data: allPayments } = await supabase
    .from('payments')
    .select('*')
    .eq('owner_id', user.id)
    .in('student_id', students.map(s => s.id))
    .gte('paid_at', twelveMonthsAgo.toISOString())
    .order('paid_at', { ascending: false })

  // 3. Group payments by student
  const paymentsByStudent = new Map<string, Payment[]>()
  for (const p of (allPayments ?? [])) {
    const arr = paymentsByStudent.get(p.student_id) ?? []
    arr.push(p)
    paymentsByStudent.set(p.student_id, arr)
  }

  // 4. Calculate pending dues for each student
  const today = new Date()
  const todayDay = today.getDate()

  const result: PendingDueStudent[] = students.map(s => {
    const studentPayments = paymentsByStudent.get(s.id) ?? []
    const rent = Number(s.rent_amount)
    const dueDay = s.monthly_due_day

    const monthsUnpaid = calculateMonthsUnpaid(dueDay, s.date_of_joining, studentPayments, today)

    // Last payment info
    const lastPayment = studentPayments.length > 0 ? studentPayments[0] : null
    const daysSincePayment = lastPayment
      ? Math.floor((today.getTime() - new Date(lastPayment.paid_at).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Status
    const status = getPaymentStatus(dueDay, studentPayments, today, s.date_of_joining)

    return {
      id: s.id,
      full_name: s.full_name,
      phone: s.phone,
      parent_phone: s.parent_phone,
      room_number: s.room_number,
      rent_amount: rent,
      monthly_due_day: dueDay,
      months_unpaid: monthsUnpaid,
      total_owed: monthsUnpaid * rent,
      last_paid_at: lastPayment?.paid_at ?? null,
      days_since_payment: daysSincePayment,
      status,
    }
  })

  // Sort: most owed first, then by status severity
  const statusOrder = { overdue: 0, due_today: 1, upcoming: 2, paid: 3 }
  result.sort((a, b) => {
    if (a.total_owed !== b.total_owed) return b.total_owed - a.total_owed
    return statusOrder[a.status] - statusOrder[b.status]
  })

  return NextResponse.json<ApiSuccess<PendingDueStudent[]>>({ data: result })
}
