import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase/server'
import type { ApiSuccess, ApiError } from '@/types'

// ── Response type ────────────────────────────────────────────────────────
export interface OwnerWithStats {
  id:            string
  full_name:     string
  hostel_name:   string
  phone:         string
  hostel_otp:    string | null
  created_at:    string
  email:         string
  student_count: number
  monthly_revenue: number
}

// ══════════════════════════════════════════════════════════════════════════
// GET /api/admin/owners
// Returns ALL hostel owners with student count + this month's revenue.
// ══════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Security Check: Only Super Admin
    if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
      return NextResponse.json<ApiError>({ error: 'Forbidden. Not Super Admin.' }, { status: 403 })
    }

    // 1. Fetch owners via admin client (bypasses RLS)
    const { data: owners, error: ownersErr } = await supabaseAdmin
      .from('hostel_owners')
      .select('*')
      .order('created_at', { ascending: false })

    if (ownersErr) {
      console.error('[DB ERROR]', ownersErr)
      return NextResponse.json<ApiError>({ error: `DB Error: ${ownersErr.message}` }, { status: 500 })
    }

    // 2. Fetch auth users securely to get emails
    const authResult = await supabaseAdmin.auth.admin.listUsers()
    if (authResult.error) {
      console.error('[AUTH ERROR]', authResult.error)
      return NextResponse.json<ApiError>({ error: `Auth Error: ${authResult.error.message}` }, { status: 500 })
    }
    
    const authUsers = authResult.data.users || []
    const emailMap = new Map(authUsers.map(u => [u.id, u.email || '']))

    // 3. Fetch stats
    const { data: students } = await supabaseAdmin
      .from('students')
      .select('id, owner_id')
      .eq('is_active', true)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('owner_id, amount_paid')
      .gte('paid_at', monthStart)

    // 4. Aggregate stats
    const studentCountMap = new Map<string, number>()
    const revenueMap = new Map<string, number>()

    for (const s of students || []) {
      studentCountMap.set(s.owner_id, (studentCountMap.get(s.owner_id) || 0) + 1)
    }
    for (const p of payments || []) {
      revenueMap.set(p.owner_id, (revenueMap.get(p.owner_id) || 0) + Number(p.amount_paid))
    }

    const result: OwnerWithStats[] = (owners || []).map(o => ({
      ...o,
      email:           emailMap.get(o.id) || '',
      student_count:   studentCountMap.get(o.id) || 0,
      monthly_revenue: revenueMap.get(o.id) || 0,
    }))

    return NextResponse.json<ApiSuccess<OwnerWithStats[]>>({ data: result })

  } catch (err: any) {
    console.error('[CRITICAL SERVER CRASH]', err)
    return NextResponse.json<ApiError>({ error: `Server Crash: ${err.message}` }, { status: 500 })
  }
}

// ══════════════════════════════════════════════════════════════════════════
// POST /api/admin/owners
// Creates a new hostel owner + auth user.
// ══════════════════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
      return NextResponse.json<ApiError>({ error: 'Forbidden. Not Super Admin.' }, { status: 403 })
    }

    let body: any
    try { body = await request.json() }
    catch { return NextResponse.json<ApiError>({ error: 'Invalid request body.' }, { status: 400 }) }

    if (!body.email || !body.full_name || !body.hostel_name || !body.phone || !body.temp_password) {
      return NextResponse.json<ApiError>({ error: 'All fields are required.' }, { status: 400 })
    }

    const hostelOtp = Math.floor(100000 + Math.random() * 900000).toString()

    // Step 1: Create auth user
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: body.email.trim().toLowerCase(),
      password: body.temp_password,
      email_confirm: true, // skip email verification for admin creation
    })

    if (authErr || !authData.user) {
      if (authErr?.message?.includes('already')) {
        return NextResponse.json<ApiError>({ error: 'An account with this email already exists.' }, { status: 409 })
      }
      return NextResponse.json<ApiError>({ error: authErr?.message || 'Failed to create auth user.' }, { status: 500 })
    }

    // Step 2: Insert into hostel_owners table
    const { data: newOwner, error: ownerErr } = await supabaseAdmin
      .from('hostel_owners')
      .insert({
        id:          authData.user.id,
        full_name:   body.full_name.trim(),
        hostel_name: body.hostel_name.trim(),
        phone:       body.phone.trim(),
        hostel_otp:  hostelOtp,
      })
      .select()
      .single()

    if (ownerErr || !newOwner) {
      // Rollback auth user creation if DB insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json<ApiError>({ error: 'Failed to create owner profile. Auth user rolled back.' }, { status: 500 })
    }

    return NextResponse.json<ApiSuccess<any>>({
      data: { ...newOwner, email: body.email },
      message: `Owner account created. Temporary password: ${body.temp_password}. Hostel OTP: ${hostelOtp}`,
    }, { status: 201 })

  } catch (err: any) {
    console.error('[CRITICAL POST CRASH]', err)
    return NextResponse.json<ApiError>({ error: `Server Crash: ${err.message}` }, { status: 500 })
  }
}