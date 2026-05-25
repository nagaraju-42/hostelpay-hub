import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, IndianRupee, ArrowRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Force Next.js to always fetch fresh data for this page
export const dynamic = 'force-dynamic'
 
export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
 
  // Fetch student summary stats
  const { data: students } = await supabase
    .from('students')
    .select('id, rent_amount, monthly_due_day')
    .eq('is_active', true)
 
  const totalStudents    = students?.length ?? 0
  const totalMonthlyRent = students?.reduce((sum, s) => sum + Number(s.rent_amount), 0) ?? 0
  const todayDay         = new Date().getDate()
  const dueTodayCount    = students?.filter(s => s.monthly_due_day === todayDay).length ?? 0
 
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-slate-800'>Dashboard</h1>
        <p className='text-slate-500 text-sm mt-1'>
          {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
      </div>
 
      {/* Stats Grid */}
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
        <StatCard icon={<Users className='w-5 h-5 text-blue-600' />}
          label='Active Students' value={totalStudents.toString()} bg='bg-blue-50' />
        <StatCard icon={<IndianRupee className='w-5 h-5 text-green-600' />}
          label='Monthly Rent' value={`₹${totalMonthlyRent.toLocaleString('en-IN')}`} bg='bg-green-50' />
        <StatCard icon={<Calendar className='w-5 h-5 text-orange-600' />}
          label='Due Today' value={dueTodayCount.toString()} bg='bg-orange-50' />
      </div>
 
      {/* Quick Actions */}
      <div className='bg-white rounded-2xl border border-slate-200 p-5'>
        <h2 className='font-semibold text-slate-700 mb-4'>Quick Actions</h2>
        <div className='space-y-3'>
          <Link href='/dashboard/students'>
            <Button variant='outline' className='w-full justify-between h-12 text-slate-700'>
              <span className='flex items-center gap-2'><Users className='w-4 h-4' />View All Students</span>
              <ArrowRight className='w-4 h-4' />
            </Button>
          </Link>
        </div>
        <p className='text-xs text-slate-400 mt-4 text-center'>
          Payment dashboard coming on Day 3 🚀
        </p>
      </div>
    </div>
  )
}
 
function StatCard({ icon, label, value, bg }: {icon:React.ReactNode;label:string;value:string;bg:string}) {
  return (
    <div className={`${bg} rounded-xl p-4 border border-slate-100`}>
      <div className='mb-2'>{icon}</div>
      <p className='text-2xl font-bold text-slate-800'>{value}</p>
      <p className='text-xs text-slate-500 mt-0.5'>{label}</p>
    </div>
  )
}