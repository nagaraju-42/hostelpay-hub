'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { RefreshCw, IndianRupee, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MarkPaidDialog } from '@/components/payments/MarkPaidDialog'
import { OverdueBanner } from '@/components/payments/OverdueBanner'
import { DueTodayCard } from '@/components/payments/DueTodayCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
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

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className='flex items-start justify-between gap-3'>
        <div>
          {/* Sahara: EB Garamond editorial headline */}
          <h1 className='font-heading text-[1.75rem] font-semibold text-[#2c1f14] leading-tight'>
            Today&apos;s Dues
          </h1>
          <p className='text-[#8a7060] text-sm mt-0.5 font-sans'>{todayStr}</p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className='gap-1.5 h-9 flex-shrink-0'
        >
          {refreshing ? <LoadingSpinner size='sm' /> : <RefreshCw className='w-3.5 h-3.5' />}
          Refresh
        </Button>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────── */}
      {!loading && (
        <div className='grid grid-cols-3 gap-3'>

          {/* Due Today — warm amber */}
          <div className='bg-[#fdf4e8] rounded-xl p-3.5 border border-[#e8d0a0]/60'>
            <div className='flex items-center gap-1.5 mb-1.5'>
              <Clock className='w-3.5 h-3.5 text-[#9a6820]' />
              <p className='text-xs text-[#7a5020] font-medium font-sans'>Due Today</p>
            </div>
            <p className='text-2xl font-bold text-[#7a5020] font-heading'>{dueToday.length}</p>
          </div>

          {/* Overdue — warm terracotta */}
          <div className='bg-[#f0e4d8] rounded-xl p-3.5 border border-[#d4b8a0]/60'>
            <div className='flex items-center gap-1.5 mb-1.5'>
              <AlertTriangle className='w-3.5 h-3.5 text-[#8c4a2a]' />
              <p className='text-xs text-[#8c4a2a] font-medium font-sans'>Overdue</p>
            </div>
            <p className='text-2xl font-bold text-[#8c4a2a] font-heading'>{overdue.length}</p>
          </div>

          {/* Collected — earthy sage */}
          <div className='bg-[#e8f0e0] rounded-xl p-3.5 border border-[#c8deb8]/60'>
            <div className='flex items-center gap-1.5 mb-1.5'>
              <IndianRupee className='w-3.5 h-3.5 text-[#4a6b3a]' />
              <p className='text-xs text-[#4a6b3a] font-medium font-sans'>Collected</p>
            </div>
            <p className='text-2xl font-bold text-[#4a6b3a] font-heading'>
              {summary ? `₹${Math.round(summary.total_amount/1000)}k` : '—'}
            </p>
          </div>

        </div>
      )}

      {/* ── Loading State ─────────────────────────────────────────── */}
      {loading && (
        <div className='space-y-3'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='bg-[#fffcf8] rounded-2xl border border-[rgba(216,208,200,0.60)] p-5 space-y-3 shadow-sahara'>
              <div className='flex justify-between'>
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-5 w-16' />
              </div>
              <Skeleton className='h-11 w-full' />
            </div>
          ))}
        </div>
      )}

      {/* ── Overdue Banner ────────────────────────────────────────── */}
      {!loading && overdue.length > 0 && (
        <OverdueBanner students={overdue} onMarkPaid={openMarkPaid} />
      )}

      {/* ── Due Today Section ─────────────────────────────────────── */}
      {!loading && (
        <div className='space-y-3'>
          {/* Section label */}
          <div className='flex items-center gap-2'>
            <Clock className='w-4 h-4 text-[#9a6820]' />
            <h2 className='font-heading font-semibold text-[#2c1f14] text-base'>
              Due Today
              {dueToday.length > 0 && (
                <span className='ml-2 text-sm font-sans font-normal text-[#8a7060]'>
                  ({dueToday.length} student{dueToday.length > 1 ? 's' : ''})
                </span>
              )}
            </h2>
          </div>

          {/* All-clear empty state */}
          {dueToday.length === 0 && paidToday.length === 0 && (
            <div className='text-center py-12 bg-[#fffcf8] rounded-2xl border border-dashed border-[rgba(216,208,200,0.80)] shadow-sahara'>
              <CheckCircle2 className='w-10 h-10 text-[#7aaa5a] mx-auto mb-3' />
              <p className='font-heading text-lg font-semibold text-[#2c1f14]'>All clear for today!</p>
              <p className='text-[#8a7060] text-sm mt-1 font-sans'>No rent due today.</p>
            </div>
          )}

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {dueToday.map(student => (
              <DueTodayCard key={student.id} student={student} onMarkPaid={openMarkPaid} />
            ))}
          </div>
        </div>
      )}

      {/* ── Paid Today Section ────────────────────────────────────── */}
      {!loading && paidToday.length > 0 && (
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <CheckCircle2 className='w-4 h-4 text-[#5a8a40]' />
            <h2 className='font-heading font-semibold text-[#2c1f14] text-base'>
              Paid Today
              <span className='ml-2 text-sm font-sans font-normal text-[#8a7060]'>
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

      {/* ── Mark Paid Dialog ──────────────────────────────────────── */}
      <MarkPaidDialog
        student={selectedStudent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onPaymentSuccess}
      />
    </div>
  )
}