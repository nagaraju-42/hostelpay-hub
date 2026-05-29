import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { StopImpersonatingButton } from '@/components/admin/StopImpersonatingButton'
import { BottomNav } from '@/components/mobile/BottomNav'
import type { ReactNode } from 'react'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isImpersonating } = await getAuthSession()
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
        {isImpersonating && (
          <div style={{ background: '#F59E0B', color: '#000', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
            <span>🕵️ Impersonation Mode</span>
            <StopImpersonatingButton />
          </div>
        )}
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