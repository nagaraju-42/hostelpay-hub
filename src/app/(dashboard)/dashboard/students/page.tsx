'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, Search, Users, Phone, DoorOpen, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BottomActionBar } from '@/components/ui/BottomActionBar'
import { AddStudentSheet } from '@/components/students/AddStudentSheet'
import type { Student } from '@/types'

export default function StudentsPage() {
  const [students, setStudents]   = useState<Student[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  async function fetchStudents() {
    setLoading(true)
    const res = await fetch('/api/students')
    const { data } = await res.json()
    setStudents(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchStudents() }, [])

  // Client-side search filter
  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.room_number.toLowerCase().includes(q) ||
      s.phone.includes(q)
    )
  })

  return (
    <div className='space-y-6'>

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='font-heading text-[1.75rem] font-semibold text-[#2c1f14] leading-tight'>
            Students
          </h1>
          <p className='text-[#8a7060] text-sm mt-0.5 font-sans'>
            {loading ? '...' : `${students.length} total · ${filtered.length} shown`}
          </p>
        </div>
        {/* Primary CTA — stays in header on desktop, moves to BottomActionBar on mobile */}
        <Button
          id='add-student-btn-desktop'
          onClick={() => setSheetOpen(true)}
          size='lg'
          className='gap-2 shrink-0 hidden sm:inline-flex'
        >
          <Plus className='w-4 h-4' />
          <span>Add Student</span>
        </Button>
      </div>

      {/* ── Search Bar ──────────────────────────────────────────────── */}
      <div className='relative'>
        <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0a090]' />
        <Input
          id='student-search'
          placeholder='Search by name, room, or phone...'
          value={search}
          onChange={e => setSearch(e.target.value)}
          className='pl-10 pr-10'
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-[#b0a090] hover:text-[#5c3d2a] p-1'
            aria-label='Clear search'
          >
            <X className='w-4 h-4' />
          </button>
        )}
      </div>

      {/* ── Loading Skeleton ─────────────────────────────────────────── */}
      {loading && (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='bg-[#fffcf8] rounded-2xl border border-[rgba(216,208,200,0.60)] p-5 space-y-3 shadow-sahara'>
              <Skeleton className='h-5 w-36' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-28' />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────────────── */}
      {!loading && students.length === 0 && (
        <div className='text-center py-16 bg-[#fffcf8] rounded-2xl border border-dashed border-[rgba(216,208,200,0.80)] shadow-sahara'>
          <div className='w-16 h-16 bg-[#f0e8db] rounded-2xl flex items-center justify-center mx-auto mb-4'>
            <Users className='w-8 h-8 text-[#c2652a]/60' />
          </div>
          <h3 className='font-heading text-lg font-semibold text-[#2c1f14] mb-1'>No students yet</h3>
          <p className='text-[#8a7060] text-sm mb-5 font-sans'>Add your first student to get started.</p>
          <Button onClick={() => setSheetOpen(true)} variant='outline' className='gap-2'>
            <Plus className='w-4 h-4' /> Add First Student
          </Button>
        </div>
      )}

      {/* ── Search Empty State ───────────────────────────────────────── */}
      {!loading && students.length > 0 && filtered.length === 0 && (
        <div className='text-center py-12 text-[#8a7060]'>
          <Search className='w-8 h-8 mx-auto mb-2 opacity-40' />
          <p className='font-sans text-sm'>No students match &ldquo;{search}&rdquo;</p>
        </div>
      )}

      {/* ── Student Cards Grid ───────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {filtered.map(student => (
            <Link
              key={student.id}
              href={`/dashboard/students/${student.id}`}
              className={[
                'block bg-[#fffcf8] rounded-2xl border border-[rgba(216,208,200,0.60)] p-5',
                'shadow-sahara',
                'hover:border-[#c2652a]/30 hover:shadow-sahara-md',
                'transition-all duration-200',
              ].join(' ')}
            >
              {/* Card top row: name + room badge */}
              <div className='flex items-start justify-between gap-2 mb-4'>
                <div>
                  <h3 className='font-heading font-semibold text-[#2c1f14] text-base leading-tight'>
                    {student.full_name}
                  </h3>
                  <p className='text-[#b0a090] text-xs mt-0.5 font-sans'>
                    Joined {format(new Date(student.date_of_joining), 'd MMM yyyy')}
                  </p>
                </div>
                {/* Room badge */}
                <Badge variant='secondary' className='text-xs flex-shrink-0 gap-1'>
                  <DoorOpen className='w-3 h-3' />
                  Room {student.room_number}
                </Badge>
              </div>

              {/* Card bottom row: phone + rent */}
              <div className='flex items-center justify-between text-sm'>
                <span className='text-[#8a7060] flex items-center gap-1.5 font-sans'>
                  <Phone className='w-3 h-3 text-[#b0a090]' />
                  {student.phone}
                </span>
                <div className='flex items-center gap-1.5'>
                  {/* Rent in sienna — brand-coloured data point */}
                  <span className='font-heading font-semibold text-[#c2652a] text-base'>
                    ₹{Number(student.rent_amount).toLocaleString('en-IN')}<span className='text-xs font-sans font-normal text-[#b0a090]'>/mo</span>
                  </span>
                  <ChevronRight className='w-4 h-4 text-[#d8d0c8]' />
                </div>
              </div>

              {/* Divider + due day */}
              <div className='mt-3 pt-3 border-t border-[rgba(216,208,200,0.50)] text-xs text-[#b0a090] font-sans'>
                Due every{' '}
                <span className='font-medium text-[#5c3d2a]'>
                  {student.monthly_due_day}{getDaySuffix(student.monthly_due_day)}
                </span>{' '}
                of the month
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Mobile Sticky Bottom Action Bar ──────────────────────────── */}
      <BottomActionBar>
        <Button
          id='add-student-btn-mobile'
          onClick={() => setSheetOpen(true)}
          size='lg'
          className='w-full gap-2 text-base font-semibold'
        >
          <Plus className='w-5 h-5' />
          Add New Student
        </Button>
      </BottomActionBar>

      {/* ── Add Student Sheet ────────────────────────────────────────── */}
      <AddStudentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={() => { setSheetOpen(false); fetchStudents() }}
      />
    </div>
  )
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}