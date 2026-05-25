'use client'
 
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, Search, Users, Phone, DoorOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
 
      {/* Page Header */}
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-slate-800'>Students</h1>
          <p className='text-slate-500 text-sm mt-0.5'>
            {loading ? '...' : `${students.length} total · ${filtered.length} shown`}
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}
          className='bg-blue-600 hover:bg-blue-500 h-10 gap-2'>
          <Plus className='w-4 h-4' /> Add Student
        </Button>
      </div>
 
      {/* Search Bar */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
        <Input
          placeholder='Search by name, room, or phone...'
          value={search}
          onChange={e => setSearch(e.target.value)}
          className='pl-9 h-11 bg-white border-slate-200'
        />
      </div>
 
      {/* Loading Skeleton */}
      {loading && (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='bg-white rounded-xl border border-slate-200 p-4 space-y-3'>
              <Skeleton className='h-5 w-36' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-28' />
            </div>
          ))}
        </div>
      )}
 
      {/* Empty State */}
      {!loading && students.length === 0 && (
        <div className='text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300'>
          <Users className='w-12 h-12 text-slate-300 mx-auto mb-3' />
          <h3 className='text-slate-600 font-semibold mb-1'>No students yet</h3>
          <p className='text-slate-400 text-sm mb-4'>Add your first student to get started.</p>
          <Button onClick={() => setSheetOpen(true)} variant='outline' className='gap-2'>
            <Plus className='w-4 h-4' /> Add First Student
          </Button>
        </div>
      )}
 
      {/* Search Empty State */}
      {!loading && students.length > 0 && filtered.length === 0 && (
        <div className='text-center py-12 text-slate-400'>
          <Search className='w-8 h-8 mx-auto mb-2 opacity-50' />
          <p>No students match &ldquo;{search}&rdquo;</p>
        </div>
      )}
 
      {/* Student Cards Grid */}
      {!loading && filtered.length > 0 && (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {filtered.map(student => (
            <Link key={student.id} href={`/dashboard/students/${student.id}`}
              className='block bg-white rounded-xl border border-slate-200 p-4
                         hover:border-blue-300 hover:shadow-md transition-all duration-150'>
              <div className='flex items-start justify-between gap-2 mb-3'>
                <div>
                  <h3 className='font-semibold text-slate-800 text-base leading-tight'>
                    {student.full_name}
                  </h3>
                  <p className='text-slate-400 text-xs mt-0.5'>Joined {format(new Date(student.date_of_joining), 'd MMM yyyy')}</p>
                </div>
                <Badge variant='secondary' className='text-xs flex-shrink-0'>
                  <DoorOpen className='w-3 h-3 mr-1' />Room {student.room_number}
                </Badge>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-slate-500 flex items-center gap-1'>
                  <Phone className='w-3 h-3' />{student.phone}
                </span>
                <span className='font-semibold text-blue-700'>
                  ₹{Number(student.rent_amount).toLocaleString('en-IN')}/mo
                </span>
              </div>
              <div className='mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400'>
                Due every <span className='font-medium text-slate-600'>{student.monthly_due_day}{getDaySuffix(student.monthly_due_day)}</span> of the month
              </div>
            </Link>
          ))}
        </div>
      )}
 
      {/* Add Student Sheet */}
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