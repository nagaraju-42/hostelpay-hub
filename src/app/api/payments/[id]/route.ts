import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import type { ApiSuccess, ApiError } from '@/types'

// ══════════════════════════════════════════════════════════════════════════
// DELETE /api/payments/[id]
// Allows owner to delete a mistakenly added payment.
// ══════════════════════════════════════════════════════════════════════════
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, user } = await getAuthSession()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })

  // Delete payment ensuring it belongs to this owner
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) {
    console.error('[DELETE /api/payments/[id]]', error)
    return NextResponse.json<ApiError>({ error: 'Failed to delete payment.' }, { status: 500 })
  }

  return NextResponse.json<ApiSuccess<null>>({ data: null, message: 'Payment deleted successfully.' })
}
