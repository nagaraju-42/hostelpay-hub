'use client'
 
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Copy, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { OwnerWithStats } from '@/app/api/admin/owners/route'
 
interface AddOwnerDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSuccess: (owner: OwnerWithStats) => void
}
 
export function AddOwnerDialog({ open, onOpenChange, onSuccess }: AddOwnerDialogProps) {
  const [form, setForm] = useState({ email:'', full_name:'', hostel_name:'', phone:'', temp_password:'' })
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<{ message: string } | null>(null)
  const [copied, setCopied]       = useState(false)
 
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))
 
  // Auto-generate a temp password
  function generatePassword() {
    const pw = 'Hostel@' + Math.floor(1000 + Math.random() * 9000)
    setForm(prev => ({ ...prev, temp_password: pw }))
  }
 
  async function handleSubmit() {
    if (!form.email || !form.full_name || !form.hostel_name || !form.phone || !form.temp_password) {
      toast.error('All fields are required.'); return
    }
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/owners', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to create owner.'); return }
      setResult({ message: data.message })
      toast.success('Owner account created!')
      onSuccess(data.data)
    } catch { toast.error('Network error.') }
    finally { setLoading(false) }
  }
 
  function copyCredentials() {
    if (!result) return
    navigator.clipboard.writeText(
      `HostelPayHub Login\nEmail: ${form.email}\nPassword: ${form.temp_password}\n${result.message}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
 
  function handleClose(o: boolean) {
    if (!o) { setForm({ email:'', full_name:'', hostel_name:'', phone:'', temp_password:'' }); setResult(null) }
    onOpenChange(o)
  }
 
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-md bg-slate-800 border-slate-700 text-white'>
        <DialogHeader>
          <DialogTitle className='text-white'>Add Hostel Owner</DialogTitle>
          <DialogDescription className='text-slate-400'>
            Creates a Supabase auth account + hostel profile in one step.
          </DialogDescription>
        </DialogHeader>
 
        {result ? (
          // Success state — show credentials to copy
          <div className='space-y-4'>
            <div className='bg-green-950 border border-green-800 rounded-xl p-4'>
              <p className='text-green-400 font-semibold text-sm mb-2'>✅ Owner Created!</p>
              <p className='text-slate-300 text-xs font-mono whitespace-pre-wrap'>{result.message}</p>
            </div>
            <Button onClick={copyCredentials} className='w-full gap-2 bg-slate-700 hover:bg-slate-600'>
              {copied ? <><CheckCheck className='w-4 h-4' />Copied!</> : <><Copy className='w-4 h-4' />Copy Credentials</>}
            </Button>
            <p className='text-slate-400 text-xs text-center'>Send these credentials to the owner via WhatsApp.</p>
            <Button variant='outline' onClick={() => handleClose(false)} className='w-full border-slate-600 text-slate-300'>
              Done
            </Button>
          </div>
        ) : (
          // Form state
          <div className='space-y-3'>
            {[
              { key: 'full_name',    label: 'Owner Full Name',    placeholder: 'Rajesh Kumar' },
              { key: 'hostel_name',  label: 'Hostel Name',        placeholder: 'Sri Ram Boys Hostel' },
              { key: 'phone',        label: 'Mobile Number',      placeholder: '9876543210' },
              { key: 'email',        label: 'Email Address',      placeholder: 'owner@hostel.in' },
            ].map(f => (
              <div key={f.key} className='space-y-1'>
                <Label className='text-slate-300 text-sm'>{f.label}</Label>
                <Input value={form[f.key as keyof typeof form]}
                  onChange={set(f.key as keyof typeof form)}
                  placeholder={f.placeholder}
                  className='bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-10' />
              </div>
            ))}
 
            <div className='space-y-1'>
              <Label className='text-slate-300 text-sm'>Temporary Password</Label>
              <div className='flex gap-2'>
                <Input value={form.temp_password}
                  onChange={set('temp_password')}
                  placeholder='Hostel@1234'
                  className='bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-10 flex-1' />
                <Button type='button' variant='outline' onClick={generatePassword}
                  className='border-slate-600 text-slate-300 hover:text-white h-10 text-xs px-3'>
                  Auto
                </Button>
              </div>
            </div>
 
            <div className='flex gap-3 pt-2'>
              <Button variant='outline' onClick={() => handleClose(false)}
                className='flex-1 border-slate-600 text-slate-300 h-11'>Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading}
                className='flex-1 bg-purple-600 hover:bg-purple-500 h-11 font-semibold'>
                {loading ? <><Loader2 className='w-4 h-4 mr-2 animate-spin'/>Creating...</> : 'Create Owner'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}