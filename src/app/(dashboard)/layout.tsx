import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import type { ReactNode } from 'react'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch hostel name for navbar
  const { data: owner } = await supabase
    .from('hostel_owners')
    .select('hostel_name')
    .eq('id', user.id)
    .single()

  return (
    // ── Sahara Dashboard Shell ──────────────────────────────────────
    // Background: warm linen (#faf5ee) — never cold slate/gray
    <div className='min-h-screen bg-[#faf5ee]'>
      <Navbar hostelName={owner?.hostel_name ?? 'My Hostel'} />
      {/* Max-width container with generous mobile padding */}
      <main className='max-w-5xl mx-auto px-4 sm:px-5 py-6 sm:py-8'>
        {children}
      </main>
    </div>
  )
}