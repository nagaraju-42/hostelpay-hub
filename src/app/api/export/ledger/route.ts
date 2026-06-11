import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { generateStudentLedger, getTodayIST, type LedgerTransaction } from '@/lib/utils/due-calc'
import type { ApiSuccess, ApiError } from '@/types'

export interface StudentLedgerData {
  student_name: string
  room_number: string
  phone: string
  rent_amount: number
  date_of_joining: string
  ledger: LedgerTransaction[]
}

export interface LedgerExportData {
  hostel_name: string
  generated_at: string
  students: StudentLedgerData[]
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthSession()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })

  // Fetch owner's hostel name
  const { data: owner } = await supabase
    .from('hostel_owners').select('hostel_name').eq('id', user.id).single()

  // Fetch all students (active and inactive) for this owner
  const { data: allStudents, error: studErr } = await supabase
    .from('students')
    .select('id, full_name, room_number, phone, rent_amount, monthly_due_day, date_of_joining, date_of_leaving, is_active, billing_type')
    .eq('owner_id', user.id)
    .order('room_number')

  if (studErr || !allStudents || allStudents.length === 0) {
    return NextResponse.json<ApiError>({ error: 'No students found.' }, { status: 404 })
  }

  // Fetch ALL payments for this owner
  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('student_id, amount_paid, payment_mode, paid_at')
    .eq('owner_id', user.id)

  if (payErr) {
    return NextResponse.json<ApiError>({ error: 'Failed to fetch payments.' }, { status: 500 })
  }

  const today = getTodayIST()

  // Fetch ALL manual charges for this owner
  const { data: manual_charges } = await supabase
    .from('manual_charges')
    .select('student_id, amount, description, date')
    .eq('owner_id', user.id)

  // Group payments by student
  const paymentsByStudent = new Map<string, any[]>()
  for (const p of payments || []) {
    if (!paymentsByStudent.has(p.student_id)) {
      paymentsByStudent.set(p.student_id, [])
    }
    paymentsByStudent.get(p.student_id)!.push(p)
  }

  // Group manual charges by student
  const chargesByStudent = new Map<string, any[]>()
  for (const c of manual_charges || []) {
    if (!chargesByStudent.has(c.student_id)) {
      chargesByStudent.set(c.student_id, [])
    }
    chargesByStudent.get(c.student_id)!.push(c)
  }

  const studentLedgers: StudentLedgerData[] = allStudents.map(student => {
    const studentPayments = paymentsByStudent.get(student.id) || []
    const studentCharges = chargesByStudent.get(student.id) || []
    
    const ledger = generateStudentLedger(
      student.rent_amount,
      student.monthly_due_day,
      student.date_of_joining,
      studentPayments,
      today,
      student.date_of_leaving,
      studentCharges,
      student.billing_type || 'prepaid'
    )

    return {
      student_name: student.full_name,
      room_number: student.room_number,
      phone: student.phone,
      rent_amount: student.rent_amount,
      date_of_joining: student.date_of_joining,
      ledger
    }
  })

  return NextResponse.json<ApiSuccess<LedgerExportData>>({
    data: {
      hostel_name: owner?.hostel_name || 'Hostel',
      generated_at: today.toLocaleString('en-IN'),
      students: studentLedgers
    }
  })
}
