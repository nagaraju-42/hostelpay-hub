import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasPaidThisCycle, getDaysPastDue } from '@/lib/utils/due-calc'
import type { ApiSuccess, ApiError } from '@/types'
import type { DueTodayStudent } from '../due-today/route'
 
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
 
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
 
  const today    = new Date()
  const todayDay = today.getDate()
  const OVERDUE_THRESHOLD = 3  // days past due before showing as overdue
 
  // Fetch all active students
  const { data: allStudents, error } = await supabase
    .from('students')
    .select('id, full_name, room_number, phone, rent_amount, monthly_due_day')
    .eq('is_active', true)
 
  if (error || !allStudents) {
    return NextResponse.json<ApiError>({ error: 'Failed to fetch students.' }, { status: 500 })
  }
 
  // Filter students whose due date was 3+ days ago
  const potentialOverdue = allStudents.filter(s => {
    const daysPast = todayDay - s.monthly_due_day
    return daysPast >= OVERDUE_THRESHOLD
  })
 
  if (potentialOverdue.length === 0) {
    return NextResponse.json<ApiSuccess<DueTodayStudent[]>>({ data: [] })
  }
 
  // Check payments for these students
  const thirtyTwoDaysAgo = new Date(today)
  thirtyTwoDaysAgo.setDate(today.getDate() - 32)
 
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('*')
    .in('student_id', potentialOverdue.map(s => s.id))
    .gte('paid_at', thirtyTwoDaysAgo.toISOString())
    .order('paid_at', { ascending: false })
 
  const result: DueTodayStudent[] = []
 
  for (const student of potentialOverdue) {
    const studentPayments = (recentPayments || []).filter(p => p.student_id === student.id)
 
    // Only include if they have NOT paid this cycle
    if (hasPaidThisCycle(student.monthly_due_day, studentPayments, today)) continue
 
    result.push({
      id:              student.id,
      full_name:       student.full_name,
      room_number:     student.room_number,
      phone:           student.phone,
      rent_amount:     Number(student.rent_amount),
      monthly_due_day: student.monthly_due_day,
      days_past_due:   getDaysPastDue(student.monthly_due_day, today),
      last_payment:    studentPayments[0] || null,
    })
  }
 
  // Sort by most overdue first
  result.sort((a, b) => b.days_past_due - a.days_past_due)
 
  return NextResponse.json<ApiSuccess<DueTodayStudent[]>>({ data: result })
}