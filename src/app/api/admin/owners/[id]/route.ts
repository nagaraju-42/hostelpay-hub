import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase/server'
import type { ApiSuccess, ApiError } from '@/types'
 
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
 
  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return NextResponse.json<ApiError>({ error: 'Forbidden.' }, { status: 403 })
  }
 
  // Fetch owner profile
  const { data: owner, error: ownerErr } = await supabaseAdmin
    .from('hostel_owners')
    .select('*')
    .eq('id', id)
    .single()
 
  if (ownerErr || !owner) {
    return NextResponse.json<ApiError>({ error: 'Owner not found.' }, { status: 404 })
  }
 
  // Get email from auth
  const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(id)
 
  // Fetch this owner's students
  const { data: students } = await supabaseAdmin
    .from('students')
    .select('id, full_name, room_number, monthly_due_day, rent_amount, is_active')
    .eq('owner_id', id)
    .order('full_name')
 
  // Fetch this month's payments
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('amount_paid, payment_mode, paid_at')
    .eq('owner_id', id)
    .gte('paid_at', monthStart)
    .order('paid_at', { ascending: false })
 
  const monthlyTotal = (payments || []).reduce((s, p) => s + Number(p.amount_paid), 0)
 
  return NextResponse.json<ApiSuccess<any>>({
    data: {
      ...owner,
      email:          authUser?.email || '',
      students:       students || [],
      monthly_total:  monthlyTotal,
      payment_count:  (payments || []).length,
    }
  })
}