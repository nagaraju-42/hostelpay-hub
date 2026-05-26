'use client'
 
import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, X, ChevronRight } from 'lucide-react'
import type { DueTodayStudent } from '@/app/api/payments/due-today/route'
 
interface OverdueBannerProps {
  students: DueTodayStudent[]
  onMarkPaid: (student: DueTodayStudent) => void
}
 
export function OverdueBanner({ students, onMarkPaid }: OverdueBannerProps) {
  const [dismissed, setDismissed] = useState(false)
 
  if (students.length === 0 || dismissed) return null
 
  return (
    <div className='bg-red-50 border border-red-200 rounded-2xl p-4'>
      <div className='flex items-start justify-between gap-3 mb-3'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0'>
            <AlertTriangle className='w-4 h-4 text-red-600' />
          </div>
          <div>
            <p className='font-semibold text-red-700 text-sm'>
              {students.length} student{students.length > 1 ? 's' : ''} overdue
            </p>
            <p className='text-red-500 text-xs'>3+ days past their due date</p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)}
          className='text-red-400 hover:text-red-600 transition-colors p-1 -m-1'>
          <X className='w-4 h-4' />
        </button>
      </div>
 
      <div className='space-y-2'>
        {students.slice(0, 5).map(student => (  // Show max 5 in banner
          <div key={student.id}
            className='flex items-center justify-between bg-white rounded-xl px-3 py-2.5
                       border border-red-100 cursor-pointer hover:border-red-300 transition-colors'
            onClick={() => onMarkPaid(student)}
          >
            <div>
              <p className='text-sm font-medium text-slate-700'>{student.full_name}</p>
              <p className='text-xs text-slate-400'>
                Room {student.room_number} · {student.days_past_due} days overdue
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-semibold text-red-600'>
                ₹{student.rent_amount.toLocaleString('en-IN')}
              </span>
              <ChevronRight className='w-4 h-4 text-slate-300' />
            </div>
          </div>
        ))}
        {students.length > 5 && (
          <Link href='/dashboard/students'
            className='text-xs text-red-500 hover:text-red-700 text-center w-full block pt-1'>
            +{students.length - 5} more overdue students →
          </Link>
        )}
      </div>
    </div>
  )
}