import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { signStudentSession } from '@/lib/jwt'
import type { ApiError, ApiSuccess } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json()

    if (!phone || !password) {
      return NextResponse.json<ApiError>({ error: 'Phone and password are required.' }, { status: 400 })
    }

    // 1. Find a student by phone or alternate_phone
    const { data: students, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, custom_password, is_active, owner_id')
      .or(`phone.eq.${phone},alternate_phone.eq.${phone}`)
      .eq('is_active', true)

    if (studentError || !students || students.length === 0) {
      return NextResponse.json<ApiError>({ error: 'Invalid phone number or password.' }, { status: 401 })
    }

    // A student might be in multiple hostels (unlikely but possible). We check all matching active students.
    let matchedStudentId: string | null = null

    for (const student of students) {
      let isValid = false

      if (student.custom_password) {
        // Verify custom password
        if (student.custom_password === password) {
          isValid = true
        }
      } else {
        // Verify against hostel_otp
        const { data: owner } = await supabaseAdmin
          .from('hostel_owners')
          .select('hostel_otp')
          .eq('id', student.owner_id)
          .single()
        
        if (owner && owner.hostel_otp === password) {
          isValid = true
        }
      }

      if (isValid) {
        matchedStudentId = student.id
        break
      }
    }

    if (!matchedStudentId) {
      return NextResponse.json<ApiError>({ error: 'Invalid phone number or password.' }, { status: 401 })
    }

    // Generate custom JWT
    const token = await signStudentSession(matchedStudentId)

    // Set cookie
    const response = NextResponse.json<ApiSuccess<{ success: boolean }>>({ data: { success: true } })
    response.cookies.set('hostel_student_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error) {
    console.error('[POST /api/student/phone-login]', error)
    return NextResponse.json<ApiError>({ error: 'Internal server error' }, { status: 500 })
  }
}
