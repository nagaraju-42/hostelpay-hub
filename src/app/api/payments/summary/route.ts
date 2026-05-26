import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { ApiSuccess, ApiError } from '@/types'
 
export interface PaymentSummary {
  month:         string   // 'YYYY-MM'
  total_amount:  number
  total_count:   number
  by_mode: {
    cash:  { amount: number; count: number }
    upi:   { amount: number; count: number }
    bank:  { amount: number; count: number }
  }
  unpaid_count:  number  // students with no payment this month
}
 
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
 
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
 
  // Get month from query param, default to current month
  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month')   // 'YYYY-MM'
  const targetMonth = monthParam || new Date().toISOString().slice(0, 7)
 
  const [year, month] = targetMonth.split('-').map(Number)
  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate   = new Date(year, month, 0, 23, 59, 59).toISOString()
 
  // Fetch all payments for this owner in the target month
  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount_paid, payment_mode')
    .eq('owner_id', user.id)
    .gte('paid_at', startDate)
    .lte('paid_at', endDate)
 
  if (error) {
    return NextResponse.json<ApiError>({ error: 'Failed to fetch summary.' }, { status: 500 })
  }
 
  // Calculate totals
  const byMode = { cash:{amount:0,count:0}, upi:{amount:0,count:0}, bank:{amount:0,count:0} }
 
  for (const p of payments || []) {
    const mode = p.payment_mode as keyof typeof byMode
    byMode[mode].amount += Number(p.amount_paid)
    byMode[mode].count  += 1
  }
 
  // Count unpaid students (active students - students who paid this month)
  const { count: activeStudents } = await supabase
    .from('students').select('*', { count: 'exact', head: true }).eq('is_active', true)
 
  const summary: PaymentSummary = {
    month:        targetMonth,
    total_amount: Object.values(byMode).reduce((s, m) => s + m.amount, 0),
    total_count:  (payments || []).length,
    by_mode:      byMode,
    unpaid_count: Math.max(0, (activeStudents || 0) - (payments || []).length),
  }
 
  return NextResponse.json<ApiSuccess<PaymentSummary>>({ data: summary })
}