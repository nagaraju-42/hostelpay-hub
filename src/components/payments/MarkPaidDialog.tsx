'use client'
 
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Banknote, Smartphone, Building2 } from 'lucide-react'
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
  { value: 'cash', label: 'Cash',         icon: Banknote,    color: 'text-green-600' },
  { value: 'upi',  label: 'UPI / Online', icon: Smartphone,  color: 'text-blue-600'  },
  { value: 'bank', label: 'Bank Transfer', icon: Building2,  color: 'text-purple-600'},
] as const
 
export function MarkPaidDialog({ student, open, onOpenChange, onSuccess }: MarkPaidDialogProps) {
  const [amount, setAmount]   = useState('')
  const [mode, setMode]       = useState<'cash' | 'upi' | 'bank'>('cash')
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState(false)
 
  // Pre-fill amount when dialog opens with a new student
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
      toast.error('Please enter a valid amount.')
      return
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
      toast.success(`✅ ₹${amountNum.toLocaleString('en-IN')} recorded for ${student.full_name}`)
      onSuccess(data.data)
      onOpenChange(false)
    } catch { toast.error('Network error. Please try again.') }
    finally { setLoading(false) }
  }
 
  if (!student) return null
 
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-sm mx-auto'>
        <DialogHeader>
          <DialogTitle className='text-lg'>Mark Payment Received</DialogTitle>
          <DialogDescription className='text-slate-500'>
            Recording rent for <span className='font-semibold text-slate-700'>{student.full_name}</span>
            {' '}· Room {student.room_number}
            {student.days_past_due > 0 && (
              <span className='text-red-500 ml-1'>· {student.days_past_due} days overdue</span>
            )}
          </DialogDescription>
        </DialogHeader>
 
        <div className='space-y-4 pt-2'>
 
          {/* Amount */}
          <div className='space-y-1.5'>
            <Label className='text-slate-700 font-medium'>Amount Received (₹)</Label>
            <Input
              type='number'
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className='h-12 text-lg font-semibold text-center'
              inputMode='numeric'
            />
            <p className='text-xs text-slate-400 text-center'>
              Monthly rent: ₹{student.rent_amount.toLocaleString('en-IN')}
            </p>
          </div>
 
          {/* Payment Mode */}
          <div className='space-y-1.5'>
            <Label className='text-slate-700 font-medium'>Payment Mode</Label>
            <div className='grid grid-cols-3 gap-2'>
              {MODE_OPTIONS.map(opt => (
                <button key={opt.value} type='button'
                  onClick={() => setMode(opt.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all
                    ${mode === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                >
                  <opt.icon className={`w-5 h-5 ${mode === opt.value ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className={`text-xs font-medium ${mode === opt.value ? 'text-blue-700' : 'text-slate-500'}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
 
          {/* Notes */}
          <div className='space-y-1.5'>
            <Label className='text-slate-700 font-medium'>Notes <span className='text-slate-400 font-normal'>(optional)</span></Label>
            <Input
              placeholder='e.g. Paid partial, will pay rest on 20th'
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className='h-11'
            />
          </div>
 
          {/* Action Buttons */}
          <div className='flex gap-3 pt-1'>
            <Button variant='outline' className='flex-1 h-12'
              onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={loading}
              className='flex-1 h-12 bg-green-600 hover:bg-green-500 font-semibold'>
              {loading ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' />Saving...</> : 'Confirm Payment'}
            </Button>
          </div>
 
        </div>
      </DialogContent>
    </Dialog>
  )
}