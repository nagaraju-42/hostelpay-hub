'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, X, ChevronRight } from 'lucide-react'
import type { DueTodayStudent } from '@/app/api/payments/due-today/route'

interface OverdueBannerProps {
  students: DueTodayStudent[]
  onMarkPaid: (student: DueTodayStudent) => void
}

// ── Sahara OverdueBanner ──────────────────────────────────────────────
// Warm terracotta tint — not harsh red-50.
// Communicates urgency without screaming. Earthy, editorial.

export function OverdueBanner({ students, onMarkPaid }: OverdueBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (students.length === 0 || dismissed) return null

  return (
    <div className='bg-[#f5ece4] border border-[rgba(140,74,42,0.25)] rounded-2xl p-4'>

      {/* ── Header row ── */}
      <div className='flex items-start justify-between gap-3 mb-3'>
        <div className='flex items-center gap-2.5'>
          {/* Icon: warm terracotta pill */}
          <div className='w-8 h-8 bg-[#e8d4c8] rounded-full flex items-center justify-center flex-shrink-0'>
            <AlertTriangle className='w-4 h-4 text-[#8c4a2a]' />
          </div>
          <div>
            <p className='font-sans font-semibold text-[#8c4a2a] text-sm'>
              {students.length} student{students.length > 1 ? 's' : ''} overdue
            </p>
            <p className='text-[#b0805a] text-xs font-sans'>3+ days past their due date</p>
          </div>
        </div>
        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className='text-[#b0a090] hover:text-[#8c4a2a] transition-colors p-1 -m-1 rounded-lg'
          aria-label='Dismiss overdue banner'
        >
          <X className='w-4 h-4' />
        </button>
      </div>

      {/* ── Student rows ── */}
      <div className='space-y-2'>
        {students.slice(0, 5).map(student => (
          <div
            key={student.id}
            className={[
              'flex items-center justify-between',
              'bg-[#fffcf8] rounded-xl px-3 py-2.5',
              'border border-[rgba(216,208,200,0.60)]',
              'cursor-pointer',
              'hover:border-[#c2652a]/30 hover:bg-[#fdf4ee]',
              'transition-all duration-150',
            ].join(' ')}
            onClick={() => onMarkPaid(student)}
          >
            <div>
              <p className='text-sm font-medium text-[#2c1f14] font-sans'>{student.full_name}</p>
              <p className='text-xs text-[#8a7060] font-sans'>
                Room {student.room_number} · {student.days_past_due} days overdue
              </p>
            </div>
            <div className='flex items-center gap-2'>
              {/* Amount in terracotta */}
              <span className='font-heading font-semibold text-[#8c4a2a] text-sm'>
                ₹{student.rent_amount.toLocaleString('en-IN')}
              </span>
              <ChevronRight className='w-4 h-4 text-[#d8d0c8]' />
            </div>
          </div>
        ))}

        {students.length > 5 && (
          <Link
            href='/dashboard/students'
            className='text-xs text-[#8c4a2a] hover:text-[#6a3020] text-center w-full block pt-1 font-sans transition-colors'
          >
            +{students.length - 5} more overdue students →
          </Link>
        )}
      </div>
    </div>
  )
}