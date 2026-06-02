import { NextRequest } from 'next/server'
import { verifyStudentSession } from '@/lib/jwt'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase/server'

export async function resolveStudentId(request: NextRequest): Promise<{ studentId: string | null; isAuthenticated: boolean }> {
  // 1. JWT
  const token = request.cookies.get('hostel_student_session')?.value
  if (token) {
    const payload = await verifyStudentSession(token)
    if (payload?.student_id) return { studentId: payload.student_id, isAuthenticated: true }
  }
  
  // 2. Supabase
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('approval_status', { ascending: true })
      .limit(1)
      .single()
    return { studentId: student?.id || null, isAuthenticated: true }
  }
  return { studentId: null, isAuthenticated: false }
}
