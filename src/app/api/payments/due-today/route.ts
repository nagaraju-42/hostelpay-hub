import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { getPaymentStatus, getDaysPastDue, getTodayIST } from '@/lib/utils/due-calc'
import type { Student, Payment, ApiSuccess, ApiError } from '@/types'
 
export interface DueTodayStudent {
  id:             string
  full_name:      string
  room_number:    string
  phone:          string
  rent_amount:    number
  monthly_due_day:number
  days_past_due:  number
  last_payment:   Payment | null
}
 
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthSession()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
 
  const today    = getTodayIST()
  const todayDay = today.getDate()
 
  const { data: allStudents, error: studErr } = await supabase
    .from('students')
    .select('id, full_name, room_number, phone, rent_amount, monthly_due_day, date_of_joining')
    .eq('owner_id', user.id)
    .eq('is_active', true)
 
  if (studErr || !allStudents) {
    return NextResponse.json<ApiError>({ error: 'Failed to fetch students.' }, { status: 500 })
  }
 
  const dueStudents = allStudents.filter(s => s.monthly_due_day === todayDay)
 
  if (dueStudents.length === 0) {
    return NextResponse.json<ApiSuccess<DueTodayStudent[]>>({ data: [] })
  }
 
  const twentyFourMonthsAgo = getTodayIST()
  twentyFourMonthsAgo.setMonth(today.getMonth() - 24)
 
  const studentIds = dueStudents.map(s => s.id)
 
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('*')
    .eq('owner_id', user.id)
    .in('student_id', studentIds)
    .gte('paid_at', twentyFourMonthsAgo.toISOString())
    .order('paid_at', { ascending: false })
 
  const result: DueTodayStudent[] = []
 
  for (const student of dueStudents) {
    const studentPayments = (recentPayments || []).filter(p => p.student_id === student.id)
 
    const status = getPaymentStatus(Number(student.rent_amount), student.monthly_due_day, student.date_of_joining, studentPayments, today)
    
    if (status !== 'due_today') continue
 
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