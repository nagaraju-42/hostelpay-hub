import type { ReactNode } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // SECURITY: Only the Super Admin email can access /admin routes
  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    redirect('/login')
  }

  return (
    // ── Sahara Admin Shell ─────────────────────────────────────────
    // Admin uses a deeper warm tone — still earthy, slightly more formal
    <div className='min-h-screen bg-[#2c1f14]'>
      <nav className='bg-[#3a2819] border-b border-[rgba(216,208,200,0.10)]'>
        <div className='max-w-6xl mx-auto px-4 h-14 flex items-center justify-between'>
          <div className='flex items-center gap-2.5'>
            {/* SA badge: sienna */}
            <div className='w-8 h-8 rounded-lg bg-[#c2652a] flex items-center justify-center'>
              <span className='text-[#fffcf8] text-xs font-bold font-sans'>SA</span>
            </div>
            <div>
              <span className='text-[#f5ede2] font-sans font-semibold text-sm'>HostelPayHub</span>
              <span className='text-[#8a7060] text-xs ml-2 font-sans'>Super Admin</span>
            </div>
          </div>
          <span className='text-[#8a7060] text-xs font-sans'>{user.email}</span>
        </div>
      </nav>
      <main className='max-w-6xl mx-auto px-4 py-6'>{children}</main>
    </div>
  )
}