import Link from 'next/link'
import { Phone, DoorOpen, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { DueTodayStudent } from '@/app/api/payments/due-today/route'

interface DueTodayCardProps {
  student:     DueTodayStudent
  onMarkPaid:  (student: DueTodayStudent) => void
  isPaid?:     boolean
  isPaying?:   boolean   // ← true while THIS student's payment is being recorded
}

// ── Sahara DueTodayCard ───────────────────────────────────────────────
// isPaying: dims the card + shows spinner in button, prevents double-tap

export function DueTodayCard({
  student, onMarkPaid, isPaid = false, isPaying = false
}: DueTodayCardProps) {
  return (
    <div
      className={[
        'bg-[#fffcf8] rounded-2xl border p-4 transition-all duration-300',
        'shadow-[0_2px_16px_rgba(58,48,42,0.04)]',
        isPaid
          ? 'border-[rgba(200,222,184,0.60)] opacity-70'
          : isPaying
            ? 'border-[#c2652a]/30 opacity-80'                // dimmed while paying
            : 'border-[rgba(216,208,200,0.60)] hover:border-[#c2652a]/30 hover:shadow-[0_4px_24px_rgba(58,48,42,0.07)]',
      ].join(' ')}
    >
      {/* ── Top row: name + amount/badge ── */}
      <div className='flex items-start justify-between gap-3 mb-3'>
        <div className='min-w-0'>
          <Link
            href={`/dashboard/students/${student.id}`}
            className='font-heading font-semibold text-[#2c1f14] hover:text-[#c2652a] transition-colors text-base leading-tight block truncate'
          >
            {student.full_name}
          </Link>
          <div className='flex items-center gap-1.5 mt-1 text-xs text-[#b0a090] font-sans'>
            <DoorOpen className='w-3 h-3' />
            <span>Room {student.room_number}</span>
            <span className='text-[#d8d0c8]'>·</span>
            <Phone className='w-3 h-3' />
            <span>{student.phone}</span>
          </div>
        </div>

        <div className='text-right flex-shrink-0'>
          <p className='font-heading font-bold text-[#2c1f14] text-base'>
            ₹{student.rent_amount.toLocaleString('en-IN')}
          </p>
          {isPaid ? (
            <Badge variant='paid' className='text-xs mt-1 gap-1'>
              <CheckCircle2 className='w-3 h-3' />Paid
            </Badge>
          ) : (
            <Badge variant='due' className='text-xs mt-1'>Due Today</Badge>
          )}
        </div>
      </div>

      {/* ── CTA: Mark as Paid — shows spinner while paying ── */}
      {!isPaid && (
        <Button
          onClick={() => !isPaying && onMarkPaid(student)}
          size='lg'
          disabled={isPaying}
          className='w-full gap-2 font-semibold'
          suppressHydrationWarning
        >
          {isPaying ? (
            <>
              <LoadingSpinner size='sm' />
              <span>Recording...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className='w-4 h-4' />
              Mark as Paid
            </>
          )}
        </Button>
      )}
    </div>
  )
}