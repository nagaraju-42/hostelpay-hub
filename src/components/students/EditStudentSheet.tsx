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

const editSchema = z.object({
  full_name:        z.string().min(2, 'Full name must be at least 2 characters.'),
  phone:            z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),
  parent_phone:     z.string().optional(),
  room_number:      z.string().min(1, 'Room number is required.'),
  age:              z.string().optional(),
  address:          z.string().optional(),
  monthly_due_day:  z.string().refine(v => { const n = parseInt(v); return !isNaN(n) && n >= 1 && n <= 28 }, 'Must be 1-28.'),
  rent_amount:      z.string().refine(v => { const n = parseFloat(v); return !isNaN(n) && n > 0 }, 'Must be positive.'),
})

type EditFormValues = z.infer<typeof editSchema>

interface EditStudentSheetProps {
  student: Student
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// ── Sahara EditStudentSheet ───────────────────────────────────────────
// Same warm palette as AddStudentSheet — consistent within the design system

export function EditStudentSheet({ student, open, onOpenChange, onSuccess }: EditStudentSheetProps) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    values: {  // 'values' keeps form in sync when student prop changes
      full_name:       student.full_name,
      phone:           student.phone,
      parent_phone:    student.parent_phone ?? '',
      room_number:     student.room_number,
      age:             student.age?.toString() ?? '',
      address:         student.address ?? '',
      monthly_due_day: student.monthly_due_day.toString(),
      rent_amount:     student.rent_amount.toString(),
    }
  })

  async function onSubmit(values: EditFormValues) {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Update failed.'); return }
      toast.success('Student details updated.')
      onSuccess()
    } catch { toast.error('Network error.') }
    finally { setSubmitting(false) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='w-full sm:max-w-md overflow-y-auto bg-[#fffcf8] border-l border-[rgba(216,208,200,0.70)]'
      >
        <SheetHeader className='mb-6'>
          <SheetTitle className='font-heading text-xl text-[#2c1f14]'>Edit Student</SheetTitle>
          <SheetDescription className='font-sans text-[#8a7060] text-sm'>
            Update {student.full_name}&apos;s details.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>

            <FormField control={form.control} name='full_name' render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#5c3d2a] font-sans'>Full Name *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
              </FormItem>
            )} />

            <div className='grid grid-cols-2 gap-3'>
              <FormField control={form.control} name='room_number' render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[#5c3d2a] font-sans'>Room No. *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
                </FormItem>
              )} />
              <FormField control={form.control} name='age' render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[#5c3d2a] font-sans'>Age</FormLabel>
                  <FormControl><Input type='number' {...field} /></FormControl>
                  <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name='phone' render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#5c3d2a] font-sans'>Mobile *</FormLabel>
                <FormControl><Input type='tel' {...field} /></FormControl>
                <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
              </FormItem>
            )} />

            <FormField control={form.control} name='parent_phone' render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#5c3d2a] font-sans'>Parent Mobile</FormLabel>
                <FormControl><Input type='tel' {...field} /></FormControl>
                <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
              </FormItem>
            )} />

            <div className='grid grid-cols-2 gap-3'>
              <FormField control={form.control} name='monthly_due_day' render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[#5c3d2a] font-sans'>Due Day (1-28) *</FormLabel>
                  <FormControl><Input type='number' min={1} max={28} {...field} /></FormControl>
                  <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
                </FormItem>
              )} />
              <FormField control={form.control} name='rent_amount' render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[#5c3d2a] font-sans'>Rent (₹) *</FormLabel>
                  <FormControl><Input type='number' {...field} /></FormControl>
                  <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name='address' render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#5c3d2a] font-sans'>Address</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
              </FormItem>
            )} />

            <Button
              type='submit'
              disabled={submitting}
              size='lg'
              className='w-full font-semibold mt-2'
            >
              {submitting
                ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' />Saving...</>
                : 'Save Changes'}
            </Button>

          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}