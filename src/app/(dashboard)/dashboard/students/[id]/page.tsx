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
import { BottomActionBar } from '@/components/ui/BottomActionBar'
import { PageLoader } from '@/components/ui/PageLoader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
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

  const getDaySuffix = (d: number) => {
    if (d >= 11 && d <= 13) return 'th'
    return ['th','st','nd','rd'][(d % 10 < 4) ? d % 10 : 0]
  }

  // ── Loading ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className='space-y-4 max-w-2xl mx-auto'>
      <Skeleton className='h-8 w-48' />
      <Skeleton className='h-52 w-full rounded-2xl' />
      <Skeleton className='h-36 w-full rounded-2xl' />
    </div>
  )

  if (!student) return null

  return (
    <>
      {deactivating && <PageLoader label='Deactivating...' />}
      
      <div className='max-w-2xl mx-auto space-y-4 pb-16 sm:pb-0'>

      {/* ── Back Button ─────────────────────────────────────────────── */}
      <Button
        variant='ghost'
        size='sm'
        onClick={() => router.back()}
        className='gap-2 text-[#8a7060] -ml-2 h-9'
      >
        <ArrowLeft className='w-4 h-4' />
        Back to Students
      </Button>

      {/* ── Profile Header Card ─────────────────────────────────────── */}
      <div className='bg-[#fffcf8] rounded-2xl border border-[rgba(216,208,200,0.60)] p-6 shadow-sahara'>
        <div className='flex items-start justify-between gap-3 mb-5'>
          <div>
            <h1 className='font-heading text-xl font-semibold text-[#2c1f14] leading-tight'>
              {student.full_name}
            </h1>
            <div className='flex items-center gap-2 mt-2 flex-wrap'>
              {/* Room badge */}
              <Badge variant='secondary' className='gap-1'>
                <DoorOpen className='w-3 h-3' />
                Room {student.room_number}
              </Badge>
              {/* Rent in sienna */}
              <Badge variant='accent'>
                ₹{Number(student.rent_amount).toLocaleString('en-IN')}/mo
              </Badge>
            </div>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setEditOpen(true)}
            className='gap-1.5 shrink-0 hidden sm:inline-flex'
          >
            <Pencil className='w-3.5 h-3.5' />
            Edit
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

      {/* ── Payment History Card ─────────────────────────────────────── */}
      <div className='bg-[#fffcf8] rounded-2xl border border-[rgba(216,208,200,0.60)] p-6 shadow-sahara'>
        <h2 className='font-heading font-semibold text-[#2c1f14] text-lg mb-4'>
          Payment History
        </h2>

        {student.payments.length === 0 ? (
          <div className='text-center py-8 text-[#8a7060]'>
            <div className='w-12 h-12 bg-[#f0e8db] rounded-xl flex items-center justify-center mx-auto mb-3'>
              <CreditCard className='w-6 h-6 text-[#c2652a]/50' />
            </div>
            <p className='text-sm font-sans'>No payments recorded yet.</p>
            <p className='text-xs mt-1 text-[#b0a090] font-sans'>Payments will appear here after Day 3.</p>
          </div>
        ) : (
          <div className='space-y-2.5'>
            {student.payments.map(payment => (
              <div
                key={payment.id}
                className='flex items-center justify-between p-3.5 bg-[#faf5ee] rounded-xl border border-[rgba(216,208,200,0.50)]'
              >
                <div>
                  <p className='text-sm font-medium text-[#2c1f14] font-sans'>
                    {format(new Date(payment.paid_at), 'd MMM yyyy')}
                  </p>
                  <p className='text-xs text-[#8a7060] mt-0.5 font-sans'>
                    Due: {format(new Date(payment.due_date), 'd MMM yyyy')}
                    {payment.notes && ` · ${payment.notes}`}
                  </p>
                </div>
                <div className='text-right'>
                  {/* Paid amount in earthy green */}
                  <p className='font-heading font-semibold text-[#4a6b3a] text-base'>
                    ₹{Number(payment.amount_paid).toLocaleString('en-IN')}
                  </p>
                  {/* Payment mode badge — earthy variants */}
                  <Badge
                    variant={
                      payment.payment_mode === 'cash' ? 'cash' :
                      payment.payment_mode === 'upi'  ? 'upi'  : 'bank'
                    }
                    className='text-xs mt-1'
                  >
                    {payment.payment_mode.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Danger Zone ─────────────────────────────────────────────── */}
      {/* Sahara: muted earthy red — not harsh bg-red-50 */}
      <div className='bg-[#f8f0ec] rounded-2xl border border-[rgba(140,60,60,0.20)] p-5'>
        <h3 className='font-sans text-sm font-semibold text-[#8c3c3c] mb-1'>Danger Zone</h3>
        <p className='text-xs text-[#a06060] mb-4 font-sans'>
          Deactivating removes this student from active lists. Payment history is never deleted.
        </p>
        <Button
          variant='destructive'
          size='sm'
          onClick={handleDeactivate}
          disabled={deactivating}
          className='gap-1.5 h-9'
        >
          {deactivating ? (
            <><LoadingSpinner size='sm' /><span className='ml-1.5'>Deactivating...</span></>
          ) : (
            <><UserX className='w-3.5 h-3.5' />Deactivate Student</>
          )}
        </Button>
      </div>

      {/* ── Edit Sheet ─────────────────────────────────────────────── */}
      <EditStudentSheet
        student={student}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => { setEditOpen(false); fetchStudent() }}
      />
      <BottomActionBar>
        <Button
          onClick={() => setEditOpen(true)}
          size='lg'
          className='w-full gap-2 text-base font-semibold'
        >
          <Pencil className='w-5 h-5' />
          Edit Student
        </Button>
      </BottomActionBar>
    </div>
    </>
  )
}

// ── InfoRow helper ──────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className='flex items-start gap-2.5 text-sm'>
      <span className='text-[#c2652a]/60 mt-0.5 w-4 h-4 flex-shrink-0'>{icon}</span>
      <div>
        <p className='text-xs text-[#b0a090] font-sans'>{label}</p>
        <p className='text-[#2c1f14] font-medium font-sans'>{value}</p>
      </div>
    </div>
  )
}