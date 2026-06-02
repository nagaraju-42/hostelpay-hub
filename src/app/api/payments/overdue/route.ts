import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { getPaymentStatus, getDaysPastDue, getTodayIST } from '@/lib/utils/due-calc'
import type { ApiSuccess, ApiError } from '@/types'
import type { DueTodayStudent } from '../due-today/route'
 
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthSession()
 
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
 
  const today = getTodayIST()
 
  // Fetch all active students
  const { data: allStudents, error } = await supabase
    .from('students')
    .select('id, full_name, room_number, phone, rent_amount, monthly_due_day, date_of_joining')
    .eq('owner_id', user.id)
    .eq('is_active', true)
 
  if (error || !allStudents) {
    return NextResponse.json<ApiError>({ error: 'Failed to fetch students.' }, { status: 500 })
  }
 
  // Check payments for these students (fetch 24 months to ensure accurate ledger)
  const twentyFourMonthsAgo = getTodayIST()
  twentyFourMonthsAgo.setMonth(today.getMonth() - 24)
 
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('*')
    .eq('owner_id', user.id)
    .in('student_id', allStudents.map(s => s.id))
    .gte('paid_at', twentyFourMonthsAgo.toISOString())
    .order('paid_at', { ascending: false })
 
  const result: DueTodayStudent[] = []
 
  for (const student of allStudents) {
    const studentPayments = (recentPayments || []).filter(p => p.student_id === student.id)
 
    const status = getPaymentStatus(Number(student.rent_amount), student.monthly_due_day, student.date_of_joining, studentPayments, today)

    // Only include if they are genuinely overdue according to ledger math
    if (status !== 'overdue') continue
 
    const lastPayment = studentPayments.length > 0 ? studentPayments[0] : null

    result.push({
      id:              student.id,
      full_name:       student.full_name,
      room_number:     student.room_number,
      phone:           student.phone,
      rent_amount:     Number(student.rent_amount),
      monthly_due_day: student.monthly_due_day,
      days_past_due:   getDaysPastDue(student.monthly_due_day, today),
      last_payment:    lastPayment,
    })
  }
 
  // Sort by highest days past due
  result.sort((a, b) => b.days_past_due - a.days_past_due)

  return NextResponse.json<ApiSuccess<DueTodayStudent[]>>({ data: result })
}