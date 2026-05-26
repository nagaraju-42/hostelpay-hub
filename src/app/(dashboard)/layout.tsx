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
    <div className='min-h-screen bg-slate-50'>
      <Navbar hostelName={owner?.hostel_name ?? 'My Hostel'} />
      <main className='max-w-5xl mx-auto px-4 py-6'>{children}</main>
    </div>
  )
}