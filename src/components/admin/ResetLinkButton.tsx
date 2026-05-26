'use client'
 
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { KeyRound, Copy, CheckCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
 
export function ResetLinkButton({ email }: { email: string }) {
  const [loading, setLoading] = useState(false)
  const [link, setLink]       = useState('')
  const [copied, setCopied]   = useState(false)
 
  async function generateLink() {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setLink(data.data.reset_link)
      toast.success('Reset link generated!')
    } catch { toast.error('Network error.') }
    finally { setLoading(false) }
  }
 
  function copyLink() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
 
  if (link) return (
    <div className='space-y-1'>
      <p className='text-xs text-slate-400 truncate max-w-xs font-mono'>{link.slice(0, 40)}...</p>
      <Button size='sm' variant='outline' onClick={copyLink}
        className='border-slate-600 text-slate-300 hover:text-white h-8 gap-1.5'>
        {copied ? <><CheckCheck className='w-3 h-3'/>Copied</> : <><Copy className='w-3 h-3'/>Copy Link</>}
      </Button>
    </div>
  )
 
  return (
    <Button size='sm' variant='outline' onClick={generateLink} disabled={loading}
      className='border-slate-600 text-slate-300 hover:text-white h-9 gap-1.5'>
      {loading ? <Loader2 className='w-3.5 h-3.5 animate-spin'/> : <KeyRound className='w-3.5 h-3.5'/>}
      Reset Password
    </Button>
  )
}