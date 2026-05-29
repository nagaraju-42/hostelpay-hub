import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import type { ApiSuccess, ApiError } from '@/types'

// ══════════════════════════════════════════════════════════════════════════
// GET /api/payments/history
// Returns payments for the owner filtered by ?month=YYYY-MM
// Joins student name + room for history display.
// ══════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthSession()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })

  const monthParam = request.nextUrl.searchParams.get('month') // e.g. "2026-05"

  let start: string
  let end:   string

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    start = `${monthParam}-01T00:00:00.000Z`
    // End = first day of next month
    const [year, mon] = monthParam.split('-').map(Number)
    const nextMonth   = mon === 12 ? 1 : mon + 1
    const nextYear    = mon === 12 ? year + 1 : year
    end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00.000Z`
  } else {
    // Default: current month
    const now = new Date()
    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    end   = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
  }

  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      *,
      students!inner(full_name, room_number)
    `)
    .eq('owner_id', user.id)
    .gte('paid_at', start)
    .lt('paid_at',  end)
    .order('paid_at', { ascending: false })

  if (error) {
    console.error('[GET /api/payments/history]', error)
    return NextResponse.json<ApiError>({ error: 'Failed to fetch payment history.' }, { status: 500 })
  }

  // Flatten student fields to top level
  const flat = (payments ?? []).map((p: any) => ({
    ...p,
    student_name: p.students?.full_name   ?? '',
    room_number:  p.students?.room_number ?? '',
    students:     undefined,
  }))

  return NextResponse.json<ApiSuccess<typeof flat>>({ data: flat })
}
