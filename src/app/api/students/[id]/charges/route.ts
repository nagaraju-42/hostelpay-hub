import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import type { ApiSuccess, ApiError, ManualCharge } from '@/types'
 
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, user } = await getAuthSession()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
 
  let body: Partial<ManualCharge>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiError>({ error: 'Invalid request body' }, { status: 400 })
  }
 
  if (!body.amount || !body.description || !body.date) {
    return NextResponse.json<ApiError>({ error: 'Amount, description, and date are required' }, { status: 400 })
  }
 
  const { data, error } = await supabase
    .from('manual_charges')
    .insert([{
      student_id: id,
      owner_id: user.id,
      amount: Number(body.amount),
      description: body.description,
      date: body.date
    }])
    .select('*')
    .single()
 
  if (error) {
    console.error('Insert error:', error)
    return NextResponse.json<ApiError>({ error: 'Failed to add manual charge' }, { status: 500 })
  }
 
  return NextResponse.json<ApiSuccess<ManualCharge>>({ data })
}
