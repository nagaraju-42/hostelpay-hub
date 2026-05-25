import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Student, StudentFormData, ApiSuccess, ApiError } from '@/types'
 
// ══════════════════════════════════════════════════════════════════════════
// GET /api/students
// Returns all ACTIVE students for the currently logged-in owner.
// RLS on the students table enforces owner isolation automatically.
// ══════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
 
  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }
 
  // Fetch all active students for this owner
  // RLS policy 'owner_sees_own_students' auto-filters by owner_id = auth.uid()
  const { data: students, error } = await supabase
    .from('students')
    .select('*')
    .eq('is_active', true)
    .order('full_name', { ascending: true })
 
  if (error) {
    console.error('[GET /api/students]', error)
    return NextResponse.json<ApiError>(
      { error: 'Failed to fetch students. Please try again.' },
      { status: 500 }
    )
  }
 
  return NextResponse.json<ApiSuccess<Student[]>>({ data: students ?? [] })
}
 
// ══════════════════════════════════════════════════════════════════════════
// POST /api/students
// Creates a new student record for this owner.
// Validates required fields. Auto-sets owner_id from session.
// ══════════════════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
 
  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }
 
  // Parse request body
  let body: StudentFormData
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiError>({ error: 'Invalid request body' }, { status: 400 })
  }
 
  // ── Field Validation ────────────────────────────────────────────────────
  const errors: string[] = []
 
  if (!body.full_name?.trim())
    errors.push('Full name is required.')
 
  if (!body.phone?.trim() || !/^[6-9]\d{9}$/.test(body.phone.trim()))
    errors.push('Phone must be a valid 10-digit Indian mobile number starting with 6-9.')
 
  if (!body.email?.trim() || !body.email.includes('@'))
    errors.push('A valid email address is required.')
 
  if (!body.room_number?.trim())
    errors.push('Room number is required.')
 
  if (!body.date_of_joining)
    errors.push('Date of joining is required.')
 
  const dueDay = parseInt(body.monthly_due_day)
  if (isNaN(dueDay) || dueDay < 1 || dueDay > 28)
    errors.push('Monthly due day must be between 1 and 28.')
 
  const rent = parseFloat(body.rent_amount)
  if (isNaN(rent) || rent <= 0)
    errors.push('Rent amount must be a positive number.')
 
  if (errors.length > 0) {
    return NextResponse.json<ApiError>(
      { error: errors.join(' ') },
      { status: 400 }
    )
  }
 
  // ── Insert ──────────────────────────────────────────────────────────────
  const { data: newStudent, error: insertError } = await supabase
    .from('students')
    .insert({
      owner_id:          user.id,  // always from session — never trust client
      full_name:         body.full_name.trim(),
      phone:             body.phone.trim(),
      parent_phone:      body.parent_phone?.trim() || null,
      emergency_contact: body.emergency_contact?.trim() || null,
      email:             body.email.trim().toLowerCase(),
      room_number:       body.room_number.trim(),
      age:               body.age ? parseInt(body.age) : null,
      address:           body.address?.trim() || null,
      aadhaar_number:    body.aadhaar_number?.trim() || null,
      date_of_joining:   body.date_of_joining,
      monthly_due_day:   dueDay,
      rent_amount:       rent,
    })
    .select()
    .single()
 
  if (insertError) {
    console.error('[POST /api/students]', insertError)
    if (insertError.code === '23505') {  // unique constraint
      return NextResponse.json<ApiError>(
        { error: 'A student with this email already exists in your hostel.' },
        { status: 409 }
      )
    }
    return NextResponse.json<ApiError>(
      { error: 'Failed to create student. Please try again.' },
      { status: 500 }
    )
  }
 
  return NextResponse.json<ApiSuccess<Student>>(
    { data: newStudent, message: 'Student added successfully.' },
    { status: 201 }
  )
}