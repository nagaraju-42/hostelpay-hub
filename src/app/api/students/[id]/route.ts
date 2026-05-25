import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { StudentWithPayments, Student, ApiSuccess, ApiError } from '@/types'
 
// ══════════════════════════════════════════════════════════════════════════
// GET /api/students/[id]
// Returns full student profile + complete payment history.
// ══════════════════════════════════════════════════════════════════════════
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
 
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
 
  // Fetch student — RLS ensures owner can only fetch their own
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()
 
  if (studentError || !student) {
    return NextResponse.json<ApiError>({ error: 'Student not found.' }, { status: 404 })
  }
 
  // Fetch payment history — ordered newest first
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', id)
    .order('paid_at', { ascending: false })
 
  const result: StudentWithPayments = {
    ...student,
    payments: payments ?? [],
  }
 
  return NextResponse.json<ApiSuccess<StudentWithPayments>>({ data: result })
}
 
// ══════════════════════════════════════════════════════════════════════════
// PATCH /api/students/[id]
// Partial update — only fields included in body are updated.
// owner_id and id are NEVER updatable.
// ══════════════════════════════════════════════════════════════════════════
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
 
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
 
  let body: Partial<Record<string, any>>
  try { body = await request.json() } catch {
    return NextResponse.json<ApiError>({ error: 'Invalid request body' }, { status: 400 })
  }
 
  // Strip fields that must never be client-updated
  const { id: _, owner_id: __, created_at: ___, password_hash: ____, ...safeBody } = body
 
  // Validate if monthly_due_day is being changed
  if (safeBody.monthly_due_day !== undefined) {
    const d = parseInt(safeBody.monthly_due_day)
    if (isNaN(d) || d < 1 || d > 28) {
      return NextResponse.json<ApiError>(
        { error: 'Monthly due day must be between 1 and 28.' }, { status: 400 }
      )
    }
    safeBody.monthly_due_day = d
  }
 
  // Validate if rent_amount is being changed
  if (safeBody.rent_amount !== undefined) {
    const r = parseFloat(safeBody.rent_amount)
    if (isNaN(r) || r <= 0) {
      return NextResponse.json<ApiError>(
        { error: 'Rent amount must be a positive number.' }, { status: 400 }
      )
    }
    safeBody.rent_amount = r
  }
 
  // RLS ensures only the owner can update their student
  const { data: updated, error } = await supabase
    .from('students')
    .update(safeBody)
    .eq('id', id)
    .select()
    .single()
 
  if (error || !updated) {
    console.error('[PATCH /api/students/[id]]', error)
    return NextResponse.json<ApiError>(
      { error: 'Update failed. Student may not exist or you lack permission.' },
      { status: 500 }
    )
  }
 
  return NextResponse.json<ApiSuccess<Student>>({ data: updated, message: 'Student updated.' })
}
 
// ══════════════════════════════════════════════════════════════════════════
// DELETE /api/students/[id]  — SOFT DELETE ONLY
// Sets is_active = false. Never deletes the row.
// Payment history is preserved for audit purposes.
// ══════════════════════════════════════════════════════════════════════════
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
 
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
 
  // Soft delete — RLS ensures only owner can deactivate their student
  const { error } = await supabase
    .from('students')
    .update({ is_active: false })
    .eq('id', id)
 
  if (error) {
    return NextResponse.json<ApiError>(
      { error: 'Failed to deactivate student.' }, { status: 500 }
    )
  }
 
  return NextResponse.json<ApiSuccess<null>>(
    { data: null, message: 'Student deactivated. Payment history preserved.' }
  )
}