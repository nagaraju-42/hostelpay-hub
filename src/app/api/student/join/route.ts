import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase/server'
import type { Student, ApiSuccess, ApiError } from '@/types'

// ══════════════════════════════════════════════════════════════════════════
// POST /api/student/join
// Authenticated student self-registers into a hostel via OTP or QR owner_id.
// ══════════════════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  // ── 1. Auth check ──────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Parse & validate body ───────────────────────────────────────────
  let body: {
    hostel_otp?: string
    owner_id?: string
    full_name: string
    phone: string
    room_number?: string
    rent_amount?: string | number
    monthly_due_day?: string | number
    aadhaar_number?: string
    address?: string
    date_of_joining?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiError>({ error: 'Invalid request body.' }, { status: 400 })
  }

  const {
    hostel_otp,
    owner_id,
    full_name,
    phone,
    room_number = '',
    rent_amount,
    monthly_due_day,
    aadhaar_number,
    address,
    date_of_joining,
  } = body

  // Required field validation
  if (!full_name || !full_name.trim()) {
    return NextResponse.json<ApiError>(
      { error: 'Full name is required.', field: 'full_name' },
      { status: 400 }
    )
  }
  if (!phone) {
    return NextResponse.json<ApiError>(
      { error: 'Phone number is required.', field: 'phone' },
      { status: 400 }
    )
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json<ApiError>(
      { error: 'Enter a valid 10-digit Indian mobile number.', field: 'phone' },
      { status: 400 }
    )
  }
  if (!hostel_otp && !owner_id) {
    return NextResponse.json<ApiError>(
      { error: 'Either hostel_otp or owner_id must be provided.' },
      { status: 400 }
    )
  }

  // ── 3. Resolve the hostel owner ────────────────────────────────────────
  let ownerQuery = supabaseAdmin.from('hostel_owners').select('*')

  if (owner_id) {
    ownerQuery = ownerQuery.eq('id', owner_id)
  } else {
    ownerQuery = ownerQuery.eq('hostel_otp', hostel_otp!)
  }

  const { data: owner, error: ownerError } = await ownerQuery.single()

  if (ownerError || !owner) {
    return NextResponse.json<ApiError>(
      { error: 'Invalid hostel code. Please check and try again.' },
      { status: 404 }
    )
  }

  // ── 4. Check if already registered in this hostel ─────────────────────
  const { data: existingData } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .eq('owner_id', owner.id)
    .limit(1)

  if (existingData && existingData.length > 0) {
    return NextResponse.json<ApiError>(
      { error: 'You are already registered in this hostel.' },
      { status: 409 }
    )
  }

  // ── 5. Check if a student with the same phone exists (link flow) ───────
  const { data: phoneMatches } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('phone', phone)
    .eq('owner_id', owner.id)
    .is('is_active', true)
    .limit(1)

  const phoneMatch = phoneMatches?.[0]
  if (phoneMatch) {
    // Link existing record to this Google account
    const { data: linked, error: linkError } = await supabaseAdmin
      .from('students')
      .update({ user_id: user.id, email: user.email || phoneMatch.email })
      .eq('phone', phone)
      .eq('owner_id', owner.id)
      .select()
      .single()

    if (linkError || !linked) {
      return NextResponse.json<ApiError>(
        { error: 'Failed to link your account. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiSuccess<Student>>(
      { data: linked as Student, message: 'Account linked to your hostel profile!' },
      { status: 200 }
    )
  }

  // ── 6. Insert new student record ───────────────────────────────────────
  const parsedRent = rent_amount != null ? parseFloat(String(rent_amount)) : null
  const parsedDueDay = monthly_due_day != null ? parseInt(String(monthly_due_day), 10) : null

  const insertPayload = {
    owner_id: owner.id,
    user_id: user.id,
    full_name: full_name.trim(),
    phone,
    room_number,
    rent_amount: parsedRent != null && !isNaN(parsedRent) ? parsedRent : (owner.default_rent ?? 0),
    monthly_due_day: parsedDueDay != null && !isNaN(parsedDueDay) ? parsedDueDay : 5,
    date_of_joining: date_of_joining || new Date().toISOString().split('T')[0],
    email: user.email || '',
    is_active: true,
    approval_status: 'pending',
    aadhaar_number: aadhaar_number || null,
    address: address || null,
  }

  const { data: newStudent, error: insertError } = await supabaseAdmin
    .from('students')
    .insert(insertPayload)
    .select()
    .single()

  if (insertError || !newStudent) {
    console.error('[POST /api/student/join] insert error:', insertError)
    return NextResponse.json<ApiError>(
      { error: 'Failed to register. Please try again.' },
      { status: 500 }
    )
  }

  // ── 7. Fire registration notification ─────────────────────────────────
  await supabaseAdmin.from('notifications').insert({
    owner_id: owner.id,
    student_id: newStudent.id,
    type: 'student_registered',
    message: `${full_name.trim()} requested to join your hostel (Room ${room_number})`,
    is_read: false,
    meta: {
      student_name: full_name.trim(),
      room_number,
      phone,
    },
  })

  return NextResponse.json<ApiSuccess<Student>>(
    { data: newStudent as Student, message: 'Successfully joined hostel!' },
    { status: 201 }
  )
}
