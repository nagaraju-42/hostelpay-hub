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
  email:              z.string().email('Enter a valid email address.').or(z.literal('')).optional(),
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
  billing_type:       z.enum(['prepaid', 'postpaid']),
})
 
type StudentFormValues = z.infer<typeof studentSchema>
 
interface AddStudentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}
 
export function AddStudentSheet({ open, onOpenChange, onSuccess }: AddStudentSheetProps) {
  const [submitting, setSubmitting] = useState(false)
 
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: '', phone: '', parent_phone: '', emergency_contact: '',
      email: '', room_number: '', age: '', address: '', aadhaar_number: '',
      date_of_joining: new Date().toISOString().split('T')[0],
      monthly_due_day: '', rent_amount: '',
      billing_type: 'prepaid',
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
      <SheetContent side='right' className='w-full sm:max-w-md overflow-y-auto'>
        <SheetHeader className='mb-6'>
          <SheetTitle>Add New Student</SheetTitle>
          <SheetDescription>Fill in the student details. Fields marked * are required.</SheetDescription>
        </SheetHeader>
 
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
 
            {/* REQUIRED FIELDS */}
            <p className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>Required Info</p>
 
            <FormField control={form.control} name='full_name' render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl><Input placeholder='e.g. Ravi Kumar' {...field} className='h-11' /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
 
            <div className='grid grid-cols-2 gap-3'>
              <FormField control={form.control} name='room_number' render={({ field }) => (
                <FormItem>
                  <FormLabel>Room No. *</FormLabel>
                  <FormControl><Input placeholder='101' {...field} className='h-11' /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='age' render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl><Input type='number' placeholder='20' {...field} className='h-11' /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
 
            <FormField control={form.control} name='phone' render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number *</FormLabel>
                <FormControl><Input type='tel' placeholder='9876543210' {...field} className='h-11' inputMode='numeric' /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
 
            {/* email moved to optional section below */}
 
            <div className='grid grid-cols-2 gap-3'>
              <FormField control={form.control} name='monthly_due_day' render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Day * (1-28)</FormLabel>
                  <FormControl><Input type='number' min={1} max={28} placeholder='12' {...field} className='h-11' /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='rent_amount' render={({ field }) => (
                <FormItem>
                  <FormLabel>Rent (₹) *</FormLabel>
                  <FormControl><Input type='number' placeholder='5000' {...field} className='h-11' /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
 
            <FormField control={form.control} name='date_of_joining' render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Joining *</FormLabel>
                <FormControl><Input type='date' {...field} className='h-11' /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name='billing_type' render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Model *</FormLabel>
                <FormControl>
                  <div className="flex gap-4 p-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name={field.name} 
                        value="prepaid" 
                        checked={field.value === 'prepaid'}
                        onChange={() => field.onChange('prepaid')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium">Prepaid (Due at Start)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name={field.name} 
                        value="postpaid" 
                        checked={field.value === 'postpaid'}
                        onChange={() => field.onChange('postpaid')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium">Postpaid (Due at End)</span>
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
 
            {/* OPTIONAL FIELDS */}
            <p className='text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2'>Optional Info</p>
 
            <FormField control={form.control} name='email' render={({ field }) => (
              <FormItem>
                <FormLabel>Email <span style={{color:'#94A3B8', fontWeight:400}}>(optional — for student login)</span></FormLabel>
                <FormControl><Input type='email' placeholder='student@gmail.com' {...field} className='h-11' /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name='parent_phone' render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Mobile</FormLabel>
                <FormControl><Input type='tel' placeholder='9876543211' {...field} className='h-11' inputMode='numeric' /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
 
            <FormField control={form.control} name='emergency_contact' render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact</FormLabel>
                <FormControl><Input placeholder='Home phone or relative number' {...field} className='h-11' /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
 
            <FormField control={form.control} name='address' render={({ field }) => (
              <FormItem>
                <FormLabel>Home Address</FormLabel>
                <FormControl><Input placeholder='Village/City, District, State' {...field} className='h-11' /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
 
            <FormField control={form.control} name='aadhaar_number' render={({ field }) => (
              <FormItem>
                <FormLabel>Aadhaar Number</FormLabel>
                <FormControl><Input placeholder='12-digit number' maxLength={12} {...field} className='h-11' inputMode='numeric' /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
 
            <Button type='submit' disabled={submitting}
              className='w-full h-12 bg-blue-600 hover:bg-blue-500 font-semibold mt-2'>
              {submitting ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' />Adding...</> : 'Add Student'}
            </Button>
 
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}