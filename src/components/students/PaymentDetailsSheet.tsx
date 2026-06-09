'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { format } from 'date-fns'
import type { Payment } from '@/types'

interface PaymentDetailsSheetProps {
  payment: Payment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PaymentDetailsSheet({ payment, open, onOpenChange }: PaymentDetailsSheetProps) {
  if (!payment) return null

  const txnId = `TXN-${payment.id.split('-')[0].toUpperCase()}`
  const modeLabel = payment.payment_mode === 'upi' ? 'UPI Transfer' 
                  : payment.payment_mode === 'bank' ? 'Bank Transfer' 
                  : 'Cash Payment'

  const title = payment.notes?.replace('Paid for: ', '') || 'Rent Payment'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="w-full sm:max-w-md rounded-t-3xl px-6 pb-10 pt-6">
        <SheetHeader className="mb-8 text-center sm:text-left">
          <SheetTitle className="text-xl font-['DM_Serif_Display']">Transaction Details</SheetTitle>
          <SheetDescription>Complete audit record of this payment.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center justify-center mb-8">
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">Amount Paid</div>
          <div className="text-4xl font-black text-emerald-600 font-['DM_Serif_Display'] tracking-tight">
            ₹{Number(payment.amount_paid).toLocaleString('en-IN')}
          </div>
          <div className="mt-3 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
            SUCCESSFUL
          </div>
        </div>

        <div className="space-y-4 bg-slate-50 border border-slate-100 p-5 rounded-2xl shadow-sm">
          <DetailRow label="Transaction ID" value={txnId} valueStyle="font-mono text-xs font-bold text-slate-700" />
          <DetailRow label="Description" value={title} />
          <DetailRow label="Payment Mode" value={modeLabel} />
          <DetailRow label="Date Paid" value={format(new Date(payment.paid_at), 'dd MMM yyyy, h:mm a')} />
          {payment.due_date && (
             <DetailRow label="Billing Cycle Due" value={format(new Date(payment.due_date), 'dd MMM yyyy')} />
          )}
          {payment.notes && payment.notes !== title && (
            <DetailRow label="Notes" value={payment.notes} />
          )}
          <div className="pt-3 mt-3 border-t border-slate-200 border-dashed">
            <DetailRow label="System Recorded" value={format(new Date(payment.created_at), 'dd MMM yyyy, h:mm a')} valueStyle="text-[11px] text-slate-400" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DetailRow({ label, value, valueStyle }: { label: string, value: string, valueStyle?: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <div className="text-[13px] font-medium text-slate-500">{label}</div>
      <div className={`text-[13px] font-semibold text-slate-900 text-right ${valueStyle || ''}`}>
        {value}
      </div>
    </div>
  )
}
