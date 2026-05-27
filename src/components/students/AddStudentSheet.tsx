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

// ── Zod Validation Schema ─────────────────────────────────────────────────
const studentSchema = z.object({
  full_name:          z.string().min(2, 'Full name must be at least 2 characters.'),
  phone:              z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),
  parent_phone:       z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit number.').or(z.literal('')),
  emergency_contact:  z.string().optional(),
  email:              z.string().email('Enter a valid email address.'),
  room_number:        z.string().min(1, 'Room number is required.'),
  age:                z.string().optional(),
  address:            z.string().optional(),
  aadhaar_number:     z.string().max(12).optional(),
  date_of_joining:    z.string().min(1, 'Date of joining is required.'),
  monthly_due_day:    z.string().refine(v => {
    const n = parseInt(v); return !isNaN(n) && n >= 1 && n <= 28
  }, 'Must be a number between 1 and 28.'),
  rent_amount:        z.string().refine(v => {
    const n = parseFloat(v); return !isNaN(n) && n > 0
  }, 'Must be a positive amount.'),
})

type StudentFormValues = z.infer<typeof studentSchema>

interface AddStudentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// ── Sahara AddStudentSheet ────────────────────────────────────────────
// • Warm white sheet panel
// • EB Garamond sheet title
// • Sienna submit button
// • Section labels in muted warm tone

export function AddStudentSheet({ open, onOpenChange, onSuccess }: AddStudentSheetProps) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: '', phone: '', parent_phone: '', emergency_contact: '',
      email: '', room_number: '', age: '', address: '', aadhaar_number: '',
      date_of_joining: new Date().toISOString().split('T')[0],
      monthly_due_day: '', rent_amount: '',
    }
  })

  async function onSubmit(values: StudentFormValues) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to add student.')
        return
      }
      toast.success(`${values.full_name} added successfully!`)
      form.reset()
      onSuccess()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='w-full sm:max-w-md overflow-y-auto bg-[#fffcf8] border-l border-[rgba(216,208,200,0.70)]'
      >
        <SheetHeader className='mb-6'>
          <SheetTitle className='font-heading text-xl text-[#2c1f14]'>Add New Student</SheetTitle>
          <SheetDescription className='font-sans text-[#8a7060] text-sm'>
            Fill in the student details. Fields marked * are required.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>

            {/* REQUIRED FIELDS */}
            <p className='text-xs font-semibold text-[#b0a090] uppercase tracking-[0.10em] font-sans'>
              Required Info
            </p>

            <FormField control={form.control} name='full_name' render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#5c3d2a] font-sans'>Full Name *</FormLabel>
                <FormControl><Input placeholder='e.g. Ravi Kumar' {...field} /></FormControl>
                <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
              </FormItem>
            )} />

            <div className='grid grid-cols-2 gap-3'>
              <FormField control={form.control} name='room_number' render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[#5c3d2a] font-sans'>Room No. *</FormLabel>
                  <FormControl><Input placeholder='101' {...field} /></FormControl>
                  <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
                </FormItem>
              )} />
              <FormField control={form.control} name='age' render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[#5c3d2a] font-sans'>Age</FormLabel>
                  <FormControl><Input type='number' placeholder='20' {...field} /></FormControl>
                  <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name='phone' render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#5c3d2a] font-sans'>Mobile Number *</FormLabel>
                <FormControl><Input type='tel' placeholder='9876543210' {...field} inputMode='numeric' /></FormControl>
                <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
              </FormItem>
            )} />

            <FormField control={form.control} name='email' render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#5c3d2a] font-sans'>Email *</FormLabel>
                <FormControl><Input type='email' placeholder='student@example.com' {...field} /></FormControl>
                <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
              </FormItem>
            )} />

            <div className='grid grid-cols-2 gap-3'>
              <FormField control={form.control} name='monthly_due_day' render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[#5c3d2a] font-sans'>Due Day * (1-28)</FormLabel>
                  <FormControl><Input type='number' min={1} max={28} placeholder='12' {...field} /></FormControl>
                  <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
                </FormItem>
              )} />
              <FormField control={form.control} name='rent_amount' render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[#5c3d2a] font-sans'>Rent (₹) *</FormLabel>
                  <FormControl><Input type='number' placeholder='5000' {...field} /></FormControl>
                  <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name='date_of_joining' render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#5c3d2a] font-sans'>Date of Joining *</FormLabel>
                <FormControl><Input type='date' {...field} /></FormControl>
                <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
              </FormItem>
            )} />

            {/* OPTIONAL FIELDS */}
            <p className='text-xs font-semibold text-[#b0a090] uppercase tracking-[0.10em] font-sans pt-2'>
              Optional Info
            </p>

            <FormField control={form.control} name='parent_phone' render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#5c3d2a] font-sans'>Parent Mobile</FormLabel>
                <FormControl><Input type='tel' placeholder='9876543211' {...field} inputMode='numeric' /></FormControl>
                <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
              </FormItem>
            )} />

            <FormField control={form.control} name='emergency_contact' render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#5c3d2a] font-sans'>Emergency Contact</FormLabel>
                <FormControl><Input placeholder='Home phone or relative number' {...field} /></FormControl>
                <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
              </FormItem>
            )} />

            <FormField control={form.control} name='address' render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#5c3d2a] font-sans'>Home Address</FormLabel>
                <FormControl><Input placeholder='Village/City, District, State' {...field} /></FormControl>
                <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
              </FormItem>
            )} />

            <FormField control={form.control} name='aadhaar_number' render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#5c3d2a] font-sans'>Aadhaar Number</FormLabel>
                <FormControl><Input placeholder='12-digit number' maxLength={12} {...field} inputMode='numeric' /></FormControl>
                <FormMessage className='text-[#8c3c3c] font-sans text-xs' />
              </FormItem>
            )} />

            {/* Submit — Sahara primary sienna, 44px */}
            <Button
              type='submit'
              disabled={submitting}
              size='lg'
              className='w-full font-semibold mt-2'
            >
              {submitting
                ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' />Adding...</>
                : 'Add Student'}
            </Button>

          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}