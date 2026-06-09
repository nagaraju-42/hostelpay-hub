'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Student } from '@/types'

const paymentSchema = z.object({
  amount: z.string().refine(v => { const n = parseFloat(v); return !isNaN(n) && n > 0 }, 'Must be positive.'),
  mode: z.enum(['cash', 'upi', 'bank_transfer']),
  paid_at: z.string().min(1, 'Date is required.'),
  notes: z.string().optional()
})

type PaymentFormValues = z.infer<typeof paymentSchema>

interface RecordPaymentSheetProps {
  student: Student
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function RecordPaymentSheet({ student, open, onOpenChange, onSuccess }: RecordPaymentSheetProps) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: student.rent_amount.toString(),
      mode: 'cash',
      paid_at: new Date().toISOString().slice(0, 16), // YYYY-MM-DDThh:mm
      notes: ''
    }
  })

  async function onSubmit(values: PaymentFormValues) {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          amount_paid: parseFloat(values.amount),
          payment_mode: values.mode === 'bank_transfer' ? 'bank' : values.mode,
          paid_at: new Date(values.paid_at).toISOString(),
          notes: values.notes
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Payment failed.'); return }
      toast.success('Payment recorded successfully.')
      form.reset()
      onSuccess()
    } catch { toast.error('Network error.') }
    finally { setSubmitting(false) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='bottom' className='w-full sm:max-w-md rounded-t-2xl px-6 pb-8'>
        <SheetHeader className='mb-6 mt-2'>
          <SheetTitle>Record Payment</SheetTitle>
          <SheetDescription>Log a payment for {student.full_name}.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField control={form.control} name='amount' render={({ field }) => (
              <FormItem><FormLabel>Amount (₹) *</FormLabel>
                <FormControl><Input type='number' {...field} className='h-11' /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='mode' render={({ field }) => (
              <FormItem><FormLabel>Payment Mode *</FormLabel>
                <FormControl>
                  <select {...field} className='flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </FormControl>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='paid_at' render={({ field }) => (
              <FormItem><FormLabel>Date & Time *</FormLabel>
                <FormControl><Input type="datetime-local" {...field} className='h-11' /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='notes' render={({ field }) => (
              <FormItem><FormLabel>Notes (Optional)</FormLabel>
                <FormControl><Input placeholder='e.g. advance rent, partial payment' {...field} className='h-11' /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <Button type='submit' disabled={submitting}
              className='w-full h-12 bg-[#0F2744] hover:bg-[#1e3a8a] text-white font-semibold mt-2'>
              {submitting ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' />Recording...</> : 'Record Payment'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
