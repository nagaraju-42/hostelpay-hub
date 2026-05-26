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
    <div className='min-h-screen bg-slate-900'>
      <nav className='bg-slate-800 border-b border-slate-700'>
        <div className='max-w-6xl mx-auto px-4 h-14 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center'>
              <span className='text-white text-xs font-bold'>SA</span>
            </div>
            <span className='text-white font-semibold text-sm'>HostelPayHub Admin</span>
            <span className='text-slate-500 text-xs ml-2'>Super Admin Panel</span>
          </div>
          <span className='text-slate-400 text-xs'>{user.email}</span>
        </div>
      </nav>
      <main className='max-w-6xl mx-auto px-4 py-6'>{children}</main>
    </div>
  )
}