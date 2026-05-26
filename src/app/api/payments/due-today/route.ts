import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasPaidThisCycle, getDaysPastDue } from '@/lib/utils/due-calc'
import type { Student, Payment, ApiSuccess, ApiError } from '@/types'
 
// ── Response shape for this endpoint ─────────────────────────────────────
export interface DueTodayStudent {
  id:             string
  full_name:      string
  room_number:    string
  phone:          string
  rent_amount:    number
  monthly_due_day:number
  days_past_due:  number   // 0 = due today, >0 = days overdue
  last_payment:   Payment | null
}
 
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
 
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
 
  const today    = new Date()
  const todayDay = today.getDate()
 
  // Step 1: Fetch ALL active students for this owner
  const { data: allStudents, error: studErr } = await supabase
    .from('students')
    .select('id, full_name, room_number, phone, rent_amount, monthly_due_day, date_of_joining')
    .eq('is_active', true)
 
  if (studErr || !allStudents) {
    return NextResponse.json<ApiError>({ error: 'Failed to fetch students.' }, { status: 500 })
  }
 
  // Step 2: Filter to only students whose due_day is today
  const dueStudents = allStudents.filter(s => s.monthly_due_day === todayDay)
 
  if (dueStudents.length === 0) {
    return NextResponse.json<ApiSuccess<DueTodayStudent[]>>({ data: [] })
  }
 
  // Step 3: For each due student, check their recent payments
  // Fetch payments from last 32 days (covers one full cycle)
  const thirtyTwoDaysAgo = new Date(today)
  thirtyTwoDaysAgo.setDate(today.getDate() - 32)
 
  const studentIds = dueStudents.map(s => s.id)
 
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('*')
    .in('student_id', studentIds)
    .gte('paid_at', thirtyTwoDaysAgo.toISOString())
    .order('paid_at', { ascending: false })
 
  // Step 4: For each student, check if they already paid this cycle
  const result: DueTodayStudent[] = []
 
  for (const student of dueStudents) {
    const studentPayments = (recentPayments || [])
      .filter(p => p.student_id === student.id)
 
    // Skip students who already paid this cycle
    if (hasPaidThisCycle(student.monthly_due_day, studentPayments, today)) continue
 
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
 
  return NextResponse.json<ApiSuccess<DueTodayStudent[]>>({ data: result })
}