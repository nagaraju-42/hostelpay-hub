import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import type { ApiSuccess, ApiError } from '@/types'
 
export interface ExportRow {
  student_name:  string
  room_number:   string
  phone:         string
  rent_amount:   number
  amount_paid:   number
  payment_mode:  string
  paid_date:     string   
  due_date:      string
  notes:         string
  status:        'Paid' | 'Unpaid'
  date_of_leaving: string | null
}
 
export interface ExportData {
  hostel_name:   string
  month:         string   
  generated_at:  string
  rows:          ExportRow[]
  summary: {
    total_students:   number
    paid_count:       number
    unpaid_count:     number
    total_collected:  number
    by_mode:          Record<string, number>
  }
}
 
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthSession()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
 
  // Get month from query param
  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month') || new Date().toISOString().slice(0, 7)
  const [year, month] = monthParam.split('-').map(Number)
 
  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate   = new Date(year, month, 0, 23, 59, 59).toISOString()
 
  const monthName = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
 
  // Fetch owner's hostel name
  const { data: owner } = await supabase
    .from('hostel_owners').select('hostel_name').eq('id', user.id).single()
 
  // Fetch all students (active and inactive) for this owner
  const { data: allStudents } = await supabase
    .from('students')
    .select('id, full_name, room_number, phone, rent_amount, monthly_due_day, is_active, date_of_leaving')
    .eq('owner_id', user.id)
    .order('room_number')
 
  if (!allStudents || allStudents.length === 0) {
    return NextResponse.json<ApiError>({ error: 'No students found.' }, { status: 404 })
  }
 
  // Fetch payments for this month
  const { data: payments } = await supabase
    .from('payments')
    .select('student_id, amount_paid, payment_mode, paid_at, due_date, notes')
    .eq('owner_id', user.id)
    .gte('paid_at', startDate)
    .lte('paid_at', endDate)
 
  // Build a lookup: student_id → payment (most recent in month)
  const paymentMap = new Map<string, any>()
  for (const p of payments || []) {
    if (!paymentMap.has(p.student_id)) paymentMap.set(p.student_id, p)
  }

  // Filter students to include in this month's report
  const students = allStudents.filter(s => {
    if (s.is_active) return true
    if (paymentMap.has(s.id)) return true
    if (s.date_of_leaving && new Date(s.date_of_leaving) >= new Date(startDate)) return true
    return false
  })
 
  // Build export rows
  const rows: ExportRow[] = students.map(s => {
    const p = paymentMap.get(s.id)
    const paidDate = p ? new Date(p.paid_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''
    const dueDate  = p ? new Date(p.due_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''
    return {
      student_name:  s.full_name,
      room_number:   s.room_number,
      phone:         s.phone,
      rent_amount:   Number(s.rent_amount),
      amount_paid:   p ? Number(p.amount_paid) : 0,
      payment_mode:  p ? p.payment_mode.toUpperCase() : '—',
      paid_date:     paidDate,
      due_date:      dueDate,
      notes:         p?.notes || '',
      status:        p ? 'Paid' : 'Unpaid',
      date_of_leaving: s.date_of_leaving,
    }
  })
 
  // Build summary
  const paidRows    = rows.filter(r => r.status === 'Paid')
  const totalCollected = paidRows.reduce((s, r) => s + r.amount_paid, 0)
  const byMode = paidRows.reduce((acc, r) => {
    acc[r.payment_mode] = (acc[r.payment_mode] || 0) + r.amount_paid
    return acc
  }, {} as Record<string, number>)
 
  const exportData: ExportData = {
    hostel_name:  owner?.hostel_name || 'My Hostel',
    month:        monthName,
    generated_at: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    rows,
    summary: {
      total_students:  students.length,
      paid_count:      paidRows.length,
      unpaid_count:    students.length - paidRows.length,
      total_collected: totalCollected,
      by_mode:         byMode,
    }
  }
 
  return NextResponse.json<ApiSuccess<ExportData>>({ data: exportData })
}