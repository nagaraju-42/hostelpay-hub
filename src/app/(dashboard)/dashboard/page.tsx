'use client'
 
import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { RefreshCw, IndianRupee, Users, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MarkPaidDialog } from '@/components/payments/MarkPaidDialog'
import { OverdueBanner } from '@/components/payments/OverdueBanner'
import { DueTodayCard } from '@/components/payments/DueTodayCard'
import type { DueTodayStudent } from '@/app/api/payments/due-today/route'
import type { Payment } from '@/types'
 export const dynamic = 'force-dynamic'
export default function DashboardPage() {
  // ── State ──────────────────────────────────────────────────────────────
  const [dueToday,  setDueToday]  = useState<DueTodayStudent[]>([])
  const [overdue,   setOverdue]   = useState<DueTodayStudent[]>([])
  const [paidToday, setPaidToday] = useState<DueTodayStudent[]>([])
  const [summary,   setSummary]   = useState<{total_amount:number;total_count:number}|null>(null)
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
 
  // Mark Paid Dialog state
  const [selectedStudent, setSelectedStudent] = useState<DueTodayStudent | null>(null)
  const [dialogOpen,      setDialogOpen]      = useState(false)
 
  // ── Data Fetching ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)
 
    try {
      const [dueRes, overdueRes, summaryRes] = await Promise.all([
        fetch('/api/payments/due-today'),
        fetch('/api/payments/overdue'),
        fetch('/api/payments/summary'),
      ])
 
      const [dueData, overdueData, summaryData] = await Promise.all([
        dueRes.json(),
        overdueRes.json(),
        summaryRes.json(),
      ])
 
      setDueToday(dueData.data  ?? [])
      setOverdue(overdueData.data ?? [])
      setSummary(summaryData.data ?? null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])
 
  useEffect(() => { fetchAll() }, [fetchAll])
 
  // ── Mark Paid Handler ──────────────────────────────────────────────────
  function openMarkPaid(student: DueTodayStudent) {
    setSelectedStudent(student)
    setDialogOpen(true)
  }
 
  function onPaymentSuccess(payment: Payment) {
    if (!selectedStudent) return
 
    // Optimistic UI: move student from 'due today' to 'paid today'
    setDueToday(prev => prev.filter(s => s.id !== selectedStudent.id))
    setOverdue(prev  => prev.filter(s => s.id !== selectedStudent.id))
    setPaidToday(prev => [...prev, selectedStudent])
 
    // Update summary count
    setSummary(prev => prev ? {
      ...prev,
      total_amount: prev.total_amount + payment.amount_paid,
      total_count:  prev.total_count + 1,
    } : prev)
 
    setSelectedStudent(null)
  }
 
  // ── Render ─────────────────────────────────────────────────────────────
  const today = new Date()
  const todayStr = format(today, 'EEEE, d MMMM yyyy')
 
  return (
    <div className='space-y-6'>
 
      {/* Page Header */}
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-slate-800'>Today&apos;s Dues</h1>
          <p className='text-slate-500 text-sm mt-0.5'>{todayStr}</p>
        </div>
        <Button variant='outline' size='sm' onClick={() => fetchAll(true)} disabled={refreshing}
          className='gap-1.5 text-slate-500 h-9 flex-shrink-0'>
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
 
      {/* Stats Row */}
      {!loading && (
        <div className='grid grid-cols-3 gap-3'>
          <div className='bg-orange-50 rounded-xl p-3 border border-orange-100'>
            <div className='flex items-center gap-1.5 mb-1'>
              <Clock className='w-3.5 h-3.5 text-orange-600' />
              <p className='text-xs text-orange-600 font-medium'>Due Today</p>
            </div>
            <p className='text-2xl font-bold text-orange-700'>{dueToday.length}</p>
          </div>
          <div className='bg-red-50 rounded-xl p-3 border border-red-100'>
            <div className='flex items-center gap-1.5 mb-1'>
              <AlertTriangle className='w-3.5 h-3.5 text-red-600' />
              <p className='text-xs text-red-600 font-medium'>Overdue</p>
            </div>
            <p className='text-2xl font-bold text-red-700'>{overdue.length}</p>
          </div>
          <div className='bg-green-50 rounded-xl p-3 border border-green-100'>
            <div className='flex items-center gap-1.5 mb-1'>
              <IndianRupee className='w-3.5 h-3.5 text-green-600' />
              <p className='text-xs text-green-600 font-medium'>Collected</p>
            </div>
            <p className='text-2xl font-bold text-green-700'>
              {summary ? `₹${Math.round(summary.total_amount/1000)}k` : '—'}
            </p>
          </div>
        </div>
      )}
 
      {/* Loading State */}
      {loading && (
        <div className='space-y-3'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='bg-white rounded-2xl border border-slate-200 p-4 space-y-3'>
              <div className='flex justify-between'>
                <Skeleton className='h-5 w-32' /><Skeleton className='h-5 w-16' />
              </div>
              <Skeleton className='h-10 w-full' />
            </div>
          ))}
        </div>
      )}
 
      {/* Overdue Banner */}
      {!loading && overdue.length > 0 && (
        <OverdueBanner students={overdue} onMarkPaid={openMarkPaid} />
      )}
 
      {/* Due Today Section */}
      {!loading && (
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <Clock className='w-4 h-4 text-orange-500' />
            <h2 className='font-semibold text-slate-700'>
              Due Today
              {dueToday.length > 0 && (
                <span className='ml-2 text-sm font-normal text-slate-400'>
                  ({dueToday.length} student{dueToday.length > 1 ? 's' : ''})
                </span>
              )}
            </h2>
          </div>
 
          {dueToday.length === 0 && paidToday.length === 0 && (
            <div className='text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200'>
              <CheckCircle2 className='w-10 h-10 text-green-400 mx-auto mb-2' />
              <p className='font-medium text-slate-600'>All clear for today!</p>
              <p className='text-slate-400 text-sm mt-1'>No rent due today.</p>
            </div>
          )}
 
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {dueToday.map(student => (
              <DueTodayCard key={student.id} student={student} onMarkPaid={openMarkPaid} />
            ))}
          </div>
        </div>
      )}
 
      {/* Paid Today Section */}
      {!loading && paidToday.length > 0 && (
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <CheckCircle2 className='w-4 h-4 text-green-500' />
            <h2 className='font-semibold text-slate-700'>
              Paid Today
              <span className='ml-2 text-sm font-normal text-slate-400'>
                ({paidToday.length} student{paidToday.length > 1 ? 's' : ''})
              </span>
            </h2>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {paidToday.map(student => (
              <DueTodayCard key={student.id} student={student} onMarkPaid={openMarkPaid} isPaid />
            ))}
          </div>
        </div>
      )}
 
      {/* Mark Paid Dialog */}
      <MarkPaidDialog
        student={selectedStudent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onPaymentSuccess}
      />
    </div>
  )
}