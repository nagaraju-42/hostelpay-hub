'use client'
 
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft, Phone, Mail, Home, Calendar, CreditCard,
  DoorOpen, User, AlertTriangle, Pencil, UserX, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EditStudentSheet } from '@/components/students/EditStudentSheet'
import { toast } from 'sonner'
import type { StudentWithPayments } from '@/types'
 
export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [student, setStudent] = useState<StudentWithPayments | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
 
  async function fetchStudent() {
    const res = await fetch(`/api/students/${id}`)
    if (!res.ok) { router.push('/dashboard/students'); return }
    const { data } = await res.json()
    setStudent(data)
    setLoading(false)
  }
 
  useEffect(() => { fetchStudent() }, [id])
 
  async function handleDeactivate() {
    if (!confirm(`Remove ${student?.full_name} from active students? Payment history is preserved.`)) return
    setDeactivating(true)
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Student deactivated. Payment history preserved.')
      router.push('/dashboard/students')
    } else {
      toast.error('Failed to deactivate student.')
      setDeactivating(false)
    }
  }
 
  if (loading) return (
    <div className='space-y-4 max-w-2xl mx-auto'>
      <Skeleton className='h-8 w-48' />
      <Skeleton className='h-48 w-full rounded-2xl' />
      <Skeleton className='h-32 w-full rounded-2xl' />
    </div>
  )
 
  if (!student) return null
 
  const getDaySuffix = (d: number) => {
    if (d >= 11 && d <= 13) return 'th'
    return ['th','st','nd','rd'][(d % 10 < 4) ? d % 10 : 0]
  }
 
  return (
    <div className='max-w-2xl mx-auto space-y-4'>
 
      {/* Back button */}
      <Button variant='ghost' size='sm' onClick={() => router.back()} className='gap-2 text-slate-500 -ml-2'>
        <ArrowLeft className='w-4 h-4' /> Back to Students
      </Button>
 
      {/* Profile Header Card */}
      <div className='bg-white rounded-2xl border border-slate-200 p-5'>
        <div className='flex items-start justify-between gap-3 mb-4'>
          <div>
            <h1 className='text-xl font-bold text-slate-800'>{student.full_name}</h1>
            <div className='flex items-center gap-2 mt-1'>
              <Badge variant='secondary'><DoorOpen className='w-3 h-3 mr-1' />Room {student.room_number}</Badge>
              <Badge className='bg-blue-100 text-blue-700 hover:bg-blue-100'>
                ₹{Number(student.rent_amount).toLocaleString('en-IN')}/mo
              </Badge>
            </div>
          </div>
          <Button variant='outline' size='sm' onClick={() => setEditOpen(true)} className='gap-1.5'>
            <Pencil className='w-3.5 h-3.5' /> Edit
          </Button>
        </div>
 
        {/* Info Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'>
          <InfoRow icon={<Phone />} label='Mobile' value={student.phone} />
          <InfoRow icon={<Mail />} label='Email' value={student.email} />
          {student.parent_phone && <InfoRow icon={<Phone />} label='Parent Mobile' value={student.parent_phone} />}
          {student.emergency_contact && <InfoRow icon={<AlertTriangle />} label='Emergency' value={student.emergency_contact} />}
          {student.address && <InfoRow icon={<Home />} label='Address' value={student.address} />}
          {student.age && <InfoRow icon={<User />} label='Age' value={`${student.age} years`} />}
          <InfoRow icon={<Calendar />} label='Joined' value={format(new Date(student.date_of_joining), 'd MMMM yyyy')} />
          <InfoRow icon={<Clock />} label='Due Day'
            value={`Every ${student.monthly_due_day}${getDaySuffix(student.monthly_due_day)} of the month`} />
          {student.aadhaar_number && (
            <InfoRow icon={<CreditCard />} label='Aadhaar' value={`XXXX XXXX ${student.aadhaar_number.slice(-4)}`} />
          )}
        </div>
      </div>
 
      {/* Payment History Card */}
      <div className='bg-white rounded-2xl border border-slate-200 p-5'>
        <h2 className='font-semibold text-slate-700 mb-4'>Payment History</h2>
        {student.payments.length === 0 ? (
          <div className='text-center py-8 text-slate-400'>
            <CreditCard className='w-8 h-8 mx-auto mb-2 opacity-40' />
            <p className='text-sm'>No payments recorded yet.</p>
            <p className='text-xs mt-1'>Payments will appear here after Day 3.</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {student.payments.map(payment => (
              <div key={payment.id}
                className='flex items-center justify-between p-3 bg-slate-50 rounded-xl'>
                <div>
                  <p className='text-sm font-medium text-slate-700'>
                    {format(new Date(payment.paid_at), 'd MMM yyyy')}
                  </p>
                  <p className='text-xs text-slate-400 mt-0.5'>
                    Due: {format(new Date(payment.due_date), 'd MMM yyyy')}
                    {payment.notes && ` · ${payment.notes}`}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='font-semibold text-green-700'>₹{Number(payment.amount_paid).toLocaleString('en-IN')}</p>
                  <Badge className={`text-xs ${
                    payment.payment_mode === 'cash' ? 'bg-green-100 text-green-700' :
                    payment.payment_mode === 'upi'  ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  } hover:bg-transparent`}>{payment.payment_mode.toUpperCase()}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
 
      {/* Danger Zone */}
      <div className='bg-red-50 rounded-2xl border border-red-200 p-4'>
        <h3 className='text-sm font-semibold text-red-700 mb-1'>Danger Zone</h3>
        <p className='text-xs text-red-500 mb-3'>
          Deactivating removes this student from active lists. Payment history is never deleted.
        </p>
        <Button variant='destructive' size='sm' onClick={handleDeactivate}
          disabled={deactivating} className='gap-1.5 h-9'>
          <UserX className='w-3.5 h-3.5' />
          {deactivating ? 'Deactivating...' : 'Deactivate Student'}
        </Button>
      </div>
 
      {/* Edit Sheet */}
      <EditStudentSheet
        student={student}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => { setEditOpen(false); fetchStudent() }}
      />
    </div>
  )
}
 
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className='flex items-start gap-2.5 text-sm'>
      <span className='text-slate-400 mt-0.5 w-4 h-4 flex-shrink-0'>{icon}</span>
      <div>
        <p className='text-xs text-slate-400'>{label}</p>
        <p className='text-slate-700 font-medium'>{value}</p>
      </div>
    </div>
  )
}