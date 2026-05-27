'use client'
 
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageLoader } from '@/components/ui/PageLoader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Copy, CheckCheck } from 'lucide-react'
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
    <>
      {loading && <PageLoader label='Creating Owner...' />}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className='max-w-md bg-[#fffcf8] border-[rgba(216,208,200,0.70)] shadow-[0_8px_40px_rgba(58,48,42,0.12)] rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='text-[#2c1f14] font-heading text-lg'>Add Hostel Owner</DialogTitle>
            <DialogDescription className='text-[#8a7060] font-sans'>
              Creates a Supabase auth account + hostel profile in one step.
            </DialogDescription>
          </DialogHeader>
 
        {result ? (
          // Success state — show credentials to copy
          <div className='space-y-4'>
            <div className='bg-[#e8f0e0] border border-[#c8deb8] rounded-xl p-4'>
              <p className='text-[#4a6b3a] font-semibold text-sm mb-2 font-sans'>✅ Owner Created!</p>
              <p className='text-[#2c1f14] text-xs font-mono whitespace-pre-wrap'>{result.message}</p>
            </div>
            <Button onClick={copyCredentials} className='w-full gap-2 bg-[#c2652a] hover:bg-[#a35220]'>
              {copied ? <><CheckCheck className='w-4 h-4' />Copied!</> : <><Copy className='w-4 h-4' />Copy Credentials</>}
            </Button>
            <p className='text-[#8a7060] text-xs text-center font-sans'>Send these credentials to the owner via WhatsApp.</p>
            <Button variant='outline' onClick={() => handleClose(false)} className='w-full'>
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
                <Label className='text-[#5c3d2a] text-sm font-sans'>{f.label}</Label>
                <Input value={form[f.key as keyof typeof form]}
                  onChange={set(f.key as keyof typeof form)}
                  placeholder={f.placeholder}
                  className='h-11 bg-white' />
              </div>
            ))}
 
            <div className='space-y-1'>
              <Label className='text-[#5c3d2a] text-sm font-sans'>Temporary Password</Label>
              <div className='flex gap-2'>
                <Input value={form.temp_password}
                  onChange={set('temp_password')}
                  placeholder='Hostel@1234'
                  className='h-11 bg-white flex-1' />
                <Button type='button' variant='outline' onClick={generatePassword}
                  className='h-11 text-xs px-4'>
                  Auto
                </Button>
              </div>
            </div>
 
            <div className='flex gap-3 pt-2'>
              <Button variant='outline' onClick={() => handleClose(false)}
                className='flex-1 h-11' disabled={loading}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading}
                className='flex-1 h-11 font-semibold'>
                {loading ? <><LoadingSpinner size='sm' /><span className='ml-2'>Creating...</span></> : 'Create Owner'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}