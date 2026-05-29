import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { ApiSuccess, ApiError } from '@/types'

// Public shape — intentionally excludes hostel_otp and sensitive fields
interface HostelPublicInfo {
  id: string
  hostel_name: string
}

// ══════════════════════════════════════════════════════════════════════════
// GET /api/student/hostel?owner_id=...
// Public (no auth) endpoint — used by the QR-code landing page to display
// the hostel name before the student logs in.
// NOTE: hostel_otp is intentionally NEVER returned here.
// ══════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const owner_id = searchParams.get('owner_id')

  if (!owner_id || !owner_id.trim()) {
    return NextResponse.json<ApiError>(
      { error: 'owner_id query parameter is required.' },
      { status: 400 }
    )
  }

  // Use admin client so even unauthenticated visitors can read hostel name
  const { data: hostel, error } = await supabaseAdmin
    .from('hostel_owners')
    .select('id, hostel_name, hostel_otp') // fetch otp internally, but strip below
    .eq('id', owner_id.trim())
    .single()

  if (error || !hostel) {
    return NextResponse.json<ApiError>(
      { error: 'Hostel not found.' },
      { status: 404 }
    )
  }

  // Return only public-safe fields — never expose hostel_otp
  const publicInfo: HostelPublicInfo = {
    id: hostel.id,
    hostel_name: hostel.hostel_name,
  }

  return NextResponse.json<ApiSuccess<HostelPublicInfo>>({ data: publicInfo })
}
