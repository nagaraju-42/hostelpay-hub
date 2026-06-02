import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { resolveStudentId } from '@/lib/auth-student'
import type { ManualCharge, ApiSuccess, ApiError } from '@/types'

export async function GET(request: NextRequest) {
  const { studentId, isAuthenticated } = await resolveStudentId(request)
  
  if (!isAuthenticated) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!studentId) {
    return NextResponse.json<ApiError>({ error: 'Not found' }, { status: 404 })
  }

  const { data: charges, error: chargesError } = await supabaseAdmin
    .from('manual_charges')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })

  if (chargesError) {
    console.error('[GET /api/student/charges]', chargesError)
    return NextResponse.json<ApiError>(
      { error: 'Failed to fetch charges.' },
      { status: 500 }
    )
  }

  return NextResponse.json<ApiSuccess<ManualCharge[]>>({ data: charges ?? [] })
}
