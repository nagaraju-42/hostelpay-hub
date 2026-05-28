import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/mobile/BottomNav'
import type { ReactNode } from 'react'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    /* Full-page background */
    <div style={{ minHeight: '100dvh', background: '#0a1628' }}>
      {/* Mobile shell — max 430px, centered */}
      <div
        style={{
          maxWidth: 430,
          marginLeft: 'auto',
          marginRight: 'auto',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: '#F8FAFC',
        }}
      >
        {/* Page content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </div>

        {/* Sticky bottom nav */}
        <BottomNav />
      </div>
    </div>
  )
}