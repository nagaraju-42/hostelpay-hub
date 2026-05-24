import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
 
export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
 
  if (!user) redirect('/login')
 
  return (
    <div className='max-w-2xl mx-auto pt-12 text-center'>
      <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-8'>
        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <span className='text-3xl'>✅</span>
        </div>
        <h1 className='text-2xl font-bold text-slate-800 mb-2'>Day 1 Complete!</h1>
        <p className='text-slate-500 mb-1'>
          Logged in as: <span className='font-mono text-blue-600'>{user.email}</span>
        </p>
      </div>
    </div>
  )
}