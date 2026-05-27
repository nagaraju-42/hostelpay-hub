'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PageLoader } from '@/components/ui/PageLoader'
import { Banknote, Smartphone, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import type { DueTodayStudent } from '@/app/api/payments/due-today/route'
import type { Payment } from '@/types'

interface MarkPaidDialogProps {
  student:      DueTodayStudent | null
  open:         boolean
  onOpenChange: (open: boolean) => void
  onSuccess:    (payment: Payment) => void
}

const MODE_OPTIONS = [
  { value: 'cash', label: 'Cash',          icon: Banknote,   color: '#4a6b3a', bg: '#e8f0e0', border: '#c8deb8' },
  { value: 'upi',  label: 'UPI / Online',  icon: Smartphone, color: '#3a4a8c', bg: '#e8eefc', border: '#b8c8e8' },
  { value: 'bank', label: 'Bank Transfer', icon: Building2,  color: '#5c3a8c', bg: '#f0e8f5', border: '#d0b8e0' },
] as const

export function MarkPaidDialog({ student, open, onOpenChange, onSuccess }: MarkPaidDialogProps) {
  const [amount, setAmount]       = useState('')
  const [mode, setMode]           = useState<'cash' | 'upi' | 'bank'>('cash')
  const [notes, setNotes]         = useState('')
  const [loading, setLoading]     = useState(false)

  function handleOpenChange(isOpen: boolean) {
    if (isOpen && student) {
      setAmount(student.rent_amount.toString())
      setMode('cash')
      setNotes('')
    }
    onOpenChange(isOpen)
  }

  async function handleConfirm() {
    if (!student) return
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount.'); return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id:   student.id,
          amount_paid:  amountNum,
          payment_mode: mode,
          notes:        notes.trim() || undefined,
        })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Payment failed.'); return }
      toast.success(`₹${amountNum.toLocaleString('en-IN')} recorded for ${student.full_name}`)
      onSuccess(data.data)
      onOpenChange(false)
    } catch { toast.error('Network error. Please try again.') }
    finally   { setLoading(false) }
  }

  if (!student) return null

  return (
    <>
      {/* ── Full-screen overlay while payment records ── */}
      {/* Mounted outside Dialog to cover the backdrop too */}
      {loading && <PageLoader label='Recording payment...' />}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className='max-w-sm mx-auto bg-[#fffcf8] border border-[rgba(216,208,200,0.70)] shadow-[0_8px_40px_rgba(58,48,42,0.10)] rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='font-heading text-lg text-[#2c1f14]'>
              Mark Payment Received
            </DialogTitle>
            <DialogDescription className='text-[#8a7060] text-sm font-sans'>
              Recording rent for{' '}
              <span className='font-semibold text-[#2c1f14]'>{student.full_name}</span>
              {' '}· Room {student.room_number}
              {student.days_past_due > 0 && (
                <span className='text-[#8c4a2a] ml-1'>· {student.days_past_due} days overdue</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 pt-2'>

            {/* ── Amount ── */}
            <div className='space-y-1.5'>
              <Label className='text-[#5c3d2a] font-medium font-sans text-sm'>
                Amount Received (₹)
              </Label>
              <Input
                type='number'
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className='h-12 text-lg font-semibold text-center font-heading'
                inputMode='numeric'
                disabled={loading}
                suppressHydrationWarning
              />
              <p className='text-xs text-[#b0a090] text-center font-sans'>
                Monthly rent: ₹{student.rent_amount.toLocaleString('en-IN')}
              </p>
            </div>

            {/* ── Payment Mode ── */}
            <div className='space-y-1.5'>
              <Label className='text-[#5c3d2a] font-medium font-sans text-sm'>Payment Mode</Label>
              <div className='grid grid-cols-3 gap-2'>
                {MODE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type='button'
                    disabled={loading}
                    onClick={() => setMode(opt.value)}
                    className={[
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2',
                      'transition-all duration-150',
                      'disabled:opacity-50 disabled:pointer-events-none',
                      mode === opt.value
                        ? 'shadow-[0_2px_16px_rgba(58,48,42,0.06)]'
                        : 'border-[rgba(216,208,200,0.60)] bg-[#fffcf8] hover:border-[rgba(216,208,200,0.90)]',
                    ].join(' ')}
                    style={mode === opt.value ? {
                      backgroundColor: opt.bg, borderColor: opt.border
                    } : {}}
                  >
                    <opt.icon
                      className='w-5 h-5'
                      style={{ color: mode === opt.value ? opt.color : '#b0a090' }}
                    />
                    <span
                      className='text-xs font-medium font-sans'
                      style={{ color: mode === opt.value ? opt.color : '#8a7060' }}
                    >
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Notes ── */}
            <div className='space-y-1.5'>
              <Label className='text-[#5c3d2a] font-medium font-sans text-sm'>
                Notes <span className='text-[#b0a090] font-normal'>(optional)</span>
              </Label>
              <Input
                placeholder='e.g. Paid partial, will pay rest on 20th'
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={loading}
                suppressHydrationWarning
              />
            </div>

            {/* ── Action Buttons ── */}
            <div className='flex gap-3 pt-1'>
              <Button
                variant='outline'
                size='lg'
                className='flex-1'
                onClick={() => onOpenChange(false)}
                disabled={loading}
                suppressHydrationWarning
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                size='lg'
                className='flex-1 font-semibold'
                suppressHydrationWarning
              >
                {loading ? (
                  <><LoadingSpinner size='sm' /><span className='ml-2'>Saving...</span></>
                ) : (
                  'Confirm Payment'
                )}
              </Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}