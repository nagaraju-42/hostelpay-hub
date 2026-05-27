import { supabaseAdmin } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResetLinkButton } from '@/components/admin/ResetLinkButton'
 export const dynamic = 'force-dynamic'
export default async function OwnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
 
  const { data: owner } = await supabaseAdmin
    .from('hostel_owners').select('*').eq('id', id).single()
  if (!owner) notFound()
 
  const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(id)
  const { data: students } = await supabaseAdmin
    .from('students').select('*').eq('owner_id', id).order('room_number')
 
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: payments } = await supabaseAdmin
    .from('payments').select('amount_paid, payment_mode')
    .eq('owner_id', id).gte('paid_at', monthStart)
    
  const monthlyTotal = (payments||[]).reduce((s,p)=>s+Number(p.amount_paid),0)
 
  return (
    <div className='space-y-6'>
      <Link href='/admin'>
        <Button variant='ghost' size='sm' className='gap-2 text-slate-400 hover:text-white -ml-2 mb-2'>
          <ArrowLeft className='w-4 h-4' /> All Owners
        </Button>
      </Link>
 
      {/* Owner Card */}
      <div className='bg-slate-800 rounded-2xl border border-slate-700 p-4 sm:p-5'>
        <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
          <div className='min-w-0'>
            <h1 className='text-xl font-bold text-white truncate'>{owner.full_name}</h1>
            <p className='text-slate-400 text-sm truncate'>{owner.hostel_name}</p>
            <p className='text-slate-500 text-xs mt-1 font-mono truncate'>{authUser?.email}</p>
          </div>
          <div className='w-full sm:w-auto'>
            <ResetLinkButton email={authUser?.email || ''} />
          </div>
        </div>
        
        {/* Mobile Fix: 1 column on mobile, 3 on desktop */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5'>
          <Stat label='Phone'    value={owner.phone} />
          <Stat label='Hostel OTP' value={owner.hostel_otp || '—'} mono />
          <Stat label='Students' value={String((students||[]).filter(s=>s.is_active).length)} />
        </div>
        
        <div className='mt-5 pt-4 border-t border-slate-700 flex flex-row items-center justify-between'>
          <span className='text-slate-400 text-sm'>This Month Revenue</span>
          <span className='text-green-400 font-bold text-lg sm:text-xl'>₹{monthlyTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>
 
      {/* Students Table */}
      <div className='bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden w-full'>
        <div className='px-4 py-3 border-b border-slate-700 flex items-center gap-2'>
          <Users className='w-4 h-4 text-slate-400' />
          <h2 className='text-white font-medium'>Students ({(students||[]).length})</h2>
        </div>
        {/* Mobile Fix: Touch scrolling for table */}
        <div className='overflow-x-auto overflow-y-hidden w-full'>
          <table className='w-full text-sm min-w-[600px]'>
            <thead><tr className='border-b border-slate-700'>
              <th className='text-left text-slate-400 font-normal px-4 py-3'>Name</th>
              <th className='text-left text-slate-400 font-normal px-4 py-3'>Room</th>
              <th className='text-right text-slate-400 font-normal px-4 py-3'>Rent</th>
              <th className='text-center text-slate-400 font-normal px-4 py-3'>Due Day</th>
              <th className='text-center text-slate-400 font-normal px-4 py-3'>Status</th>
            </tr></thead>
            <tbody>
              {(students||[]).map(s => (
                <tr key={s.id} className='border-b border-slate-700/50 hover:bg-slate-700/20'>
                  <td className='px-4 py-3 text-slate-200 whitespace-nowrap'>{s.full_name}</td>
                  <td className='px-4 py-3 text-slate-400'>{s.room_number}</td>
                  <td className='px-4 py-3 text-right text-slate-300 whitespace-nowrap'>₹{Number(s.rent_amount).toLocaleString('en-IN')}</td>
                  <td className='px-4 py-3 text-center text-slate-400'>{s.monthly_due_day}</td>
                  <td className='px-4 py-3 text-center'>
                    <Badge className={s.is_active ? 'bg-green-900/50 text-green-400' : 'bg-slate-700/50 text-slate-400'}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
 
function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className='bg-slate-700/50 rounded-xl p-3 border border-slate-700/50'>
      <p className='text-slate-400 text-xs'>{label}</p>
      <p className={`text-white font-medium mt-1 truncate ${mono ? 'font-mono text-yellow-300' : ''}`}>{value}</p>
    </div>
  )
}