import Link from 'next/link'
import { Phone, DoorOpen, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { DueTodayStudent } from '@/app/api/payments/due-today/route'
 
interface DueTodayCardProps {
  student:     DueTodayStudent
  onMarkPaid:  (student: DueTodayStudent) => void
  isPaid?:     boolean
}
 
export function DueTodayCard({ student, onMarkPaid, isPaid = false }: DueTodayCardProps) {
  return (
    <div className={`bg-white rounded-2xl border p-4 transition-all duration-300
      ${isPaid ? 'border-green-200 opacity-75' : 'border-slate-200 hover:border-blue-200 hover:shadow-sm'}
    `}>
      <div className='flex items-start justify-between gap-3 mb-3'>
        <div className='min-w-0'>
          <Link href={`/dashboard/students/${student.id}`}
            className='font-semibold text-slate-800 hover:text-blue-600 transition-colors text-base leading-tight block truncate'>
            {student.full_name}
          </Link>
          <div className='flex items-center gap-1.5 mt-1 text-xs text-slate-400'>
            <DoorOpen className='w-3 h-3' />
            <span>Room {student.room_number}</span>
            <span>·</span>
            <Phone className='w-3 h-3' />
            <span>{student.phone}</span>
          </div>
        </div>
        <div className='text-right flex-shrink-0'>
          <p className='font-bold text-slate-800 text-base'>
            ₹{student.rent_amount.toLocaleString('en-IN')}
          </p>
          {isPaid ? (
            <Badge className='bg-green-100 text-green-700 hover:bg-green-100 text-xs mt-1'>
              <CheckCircle2 className='w-3 h-3 mr-1' />Paid
            </Badge>
          ) : (
            <Badge variant='secondary' className='text-xs mt-1'>Due Today</Badge>
          )}
        </div>
      </div>
 
      {!isPaid && (
        <Button onClick={() => onMarkPaid(student)} size='sm'
          className='w-full h-10 bg-green-600 hover:bg-green-500 text-white font-semibold gap-2'>
          <CheckCircle2 className='w-4 h-4' />
          Mark as Paid
        </Button>
      )}
    </div>
  )
}