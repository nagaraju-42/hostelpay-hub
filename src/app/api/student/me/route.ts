export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase/server'
import { resolveStudentId } from '@/lib/auth-student'
import type { Student, OwnerPublicInfo, ApiSuccess, ApiError } from '@/types'

// Enriched student shape returned by GET
interface StudentWithOwner extends Student {
  owner: OwnerPublicInfo
}

// ══════════════════════════════════════════════════════════════════════════
// GET /api/student/me
// Returns the authenticated student's profile + hostel owner public info.
// ══════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  const { studentId, isAuthenticated } = await resolveStudentId(request)
  if (!isAuthenticated) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!studentId) {
    return NextResponse.json<ApiError>({ error: 'No student profile found. Please join a hostel first.' }, { status: 404 })
  }

  const { data: students, error } = await supabaseAdmin
    .from('students')
    .select('*, hostel_owners!inner(hostel_name, hostel_otp, payment_qr_url, payment_qr_note, upi_id, phone)')
    .eq('id', studentId)
    .eq('is_active', true)
    .order('approval_status', { ascending: true })
    .limit(1)

  const student = students?.[0]
  if (error || !student) {
    if (error) console.error('[GET /api/student/me] error:', error)
    return NextResponse.json<ApiError>(
      { error: 'No student profile found. Please join a hostel first.' },
      { status: 404 }
    )
  }

  // Flatten hostel_owners into an `owner` field
  const { hostel_owners, ...studentFields } = student as typeof student & {
    hostel_owners: OwnerPublicInfo
  }

  const result: StudentWithOwner = {
    ...(studentFields as unknown as Student),
    owner: hostel_owners,
  }

  return NextResponse.json<ApiSuccess<StudentWithOwner>>({ data: result })
}

// ══════════════════════════════════════════════════════════════════════════
// PATCH /api/student/me
// Student updates their own allowed profile fields.
// ══════════════════════════════════════════════════════════════════════════
export async function PATCH(request: NextRequest) {
  const { studentId, isAuthenticated } = await resolveStudentId(request)
  if (!isAuthenticated) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!studentId) {
    return NextResponse.json<ApiError>({ error: 'Not found' }, { status: 404 })
  }

  let body: {
    phone?: string
    address?: string
    aadhaar_number?: string
    full_name?: string
    alternate_phone?: string
    custom_password?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiError>({ error: 'Invalid request body.' }, { status: 400 })
  }

  // Validate phone if provided
  if (body.phone !== undefined && !/^[6-9]\d{9}$/.test(body.phone)) {
    return NextResponse.json<ApiError>(
      { error: 'Enter a valid 10-digit Indian mobile number.', field: 'phone' },
      { status: 400 }
    )
  }

  // Build safe update object — only allow these fields
  const updateObj: Record<string, string | null> = {}
  if (body.full_name !== undefined) updateObj.full_name = body.full_name.trim()
  if (body.phone !== undefined) updateObj.phone = body.phone
  if (body.address !== undefined) updateObj.address = body.address || null
  if (body.aadhaar_number !== undefined) updateObj.aadhaar_number = body.aadhaar_number || null
  if (body.alternate_phone !== undefined) updateObj.alternate_phone = body.alternate_phone || null
  if (body.custom_password !== undefined) updateObj.custom_password = body.custom_password || null

  if (Object.keys(updateObj).length === 0) {
    return NextResponse.json<ApiError>(
      { error: 'No updatable fields provided.' },
      { status: 400 }
    )
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('students')
    .update(updateObj)
    .eq('id', studentId)
    .select()
    .single()

  if (updateError || !updated) {
    console.error('[PATCH /api/student/me]', updateError)
    return NextResponse.json<ApiError>(
      { error: 'Update failed. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json<ApiSuccess<Student>>(
    { data: updated as Student, message: 'Profile updated.' }
  )
}

// ══════════════════════════════════════════════════════════════════════════
// DELETE /api/student/me
// Unlinks the student from their hostel (sets user_id = null).
// Allows them to join a different hostel afterward.
// ══════════════════════════════════════════════════════════════════════════
export async function DELETE(request: NextRequest) {
  const { studentId, isAuthenticated } = await resolveStudentId(request)
  if (!isAuthenticated) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!studentId) {
    return NextResponse.json<ApiError>({ error: 'Not found' }, { status: 404 })
  }

  // Delete the custom JWT cookie just in case
  const response = NextResponse.json<ApiSuccess<{ success: boolean }>>(
    { data: { success: true }, message: 'Left hostel successfully.' },
    { status: 200 }
  )
  response.cookies.delete('hostel_student_session')

  const { error } = await supabaseAdmin
    .from('students')
    .update({ user_id: null })
    .eq('id', studentId)

  if (error) {
    console.error('[DELETE /api/student/me]', error)
    return NextResponse.json<ApiError>(
      { error: 'Failed to leave hostel. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json<ApiSuccess<null>>(
    { data: null, message: 'Left hostel successfully.' }
  )
}
