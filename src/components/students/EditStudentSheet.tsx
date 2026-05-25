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
      <SheetContent side='right' className='w-full sm:max-w-md overflow-y-auto'>
        <SheetHeader className='mb-6'>
          <SheetTitle>Edit Student</SheetTitle>
          <SheetDescription>Update {student.full_name}&apos;s details.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField control={form.control} name='full_name' render={({ field }) => (
              <FormItem><FormLabel>Full Name *</FormLabel>
                <FormControl><Input {...field} className='h-11' /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <div className='grid grid-cols-2 gap-3'>
              <FormField control={form.control} name='room_number' render={({ field }) => (
                <FormItem><FormLabel>Room No. *</FormLabel>
                  <FormControl><Input {...field} className='h-11' /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='age' render={({ field }) => (
                <FormItem><FormLabel>Age</FormLabel>
                  <FormControl><Input type='number' {...field} className='h-11' /></FormControl>
                  <FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='phone' render={({ field }) => (
              <FormItem><FormLabel>Mobile *</FormLabel>
                <FormControl><Input type='tel' {...field} className='h-11' /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='parent_phone' render={({ field }) => (
              <FormItem><FormLabel>Parent Mobile</FormLabel>
                <FormControl><Input type='tel' {...field} className='h-11' /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <div className='grid grid-cols-2 gap-3'>
              <FormField control={form.control} name='monthly_due_day' render={({ field }) => (
                <FormItem><FormLabel>Due Day (1-28) *</FormLabel>
                  <FormControl><Input type='number' min={1} max={28} {...field} className='h-11' /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='rent_amount' render={({ field }) => (
                <FormItem><FormLabel>Rent (₹) *</FormLabel>
                  <FormControl><Input type='number' {...field} className='h-11' /></FormControl>
                  <FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='address' render={({ field }) => (
              <FormItem><FormLabel>Address</FormLabel>
                <FormControl><Input {...field} className='h-11' /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <Button type='submit' disabled={submitting}
              className='w-full h-12 bg-blue-600 hover:bg-blue-500 font-semibold mt-2'>
              {submitting ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' />Saving...</> : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}