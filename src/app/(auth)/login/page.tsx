'use client'
 
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Building2 } from 'lucide-react'
 
export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
 
  // ── Form State ──────────────────────────────────────────────────
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
 
  // ── Submit Handler ───────────────────────────────────────────────
  async function handleLogin() {
    setError('')
 
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
 
    setLoading(true)
 
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
 
    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        setError('Wrong email or password. Please try again.')
      } else {
        setError('Login failed. Please check your connection and try again.')
      }
      setLoading(false)
      return
    }
 
    // Success — middleware will handle redirect to /dashboard
    router.push('/dashboard')
    router.refresh()
  }
 
  // ── Render ───────────────────────────────────────────────────────
  return (
    <Card className='w-full max-w-sm shadow-2xl border-slate-700 bg-slate-800/90 backdrop-blur'>
 
      <CardHeader className='space-y-3 pb-4'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center'>
            <Building2 className='w-6 h-6 text-white' />
          </div>
          <div>
            <p className='text-xs text-slate-400 uppercase tracking-widest'>Welcome to</p>
            <p className='text-white font-bold text-lg leading-none'>HostelPayHub</p>
          </div>
        </div>
        <CardTitle className='text-white text-xl'>Owner Login</CardTitle>
        <CardDescription className='text-slate-400 text-sm'>
          Enter the credentials provided by your administrator.
        </CardDescription>
      </CardHeader>
 
      <CardContent className='space-y-4'>
 
        <div className='space-y-2'>
          <Label htmlFor='email' className='text-slate-300 text-sm font-medium'>Email Address</Label>
          <Input
            id='email'
            type='email'
            placeholder='owner@example.com'
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            className='bg-slate-700 border-slate-600 text-white placeholder:text-slate-500
                       focus:border-blue-500 h-12 text-base'
          />
        </div>
 
        <div className='space-y-2'>
          <Label htmlFor='password' className='text-slate-300 text-sm font-medium'>Password</Label>
          <Input
            id='password'
            type='password'
            placeholder='Enter your password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            disabled={loading}
            className='bg-slate-700 border-slate-600 text-white placeholder:text-slate-500
                       focus:border-blue-500 h-12 text-base'
          />
        </div>
 
        {error && (
          <div className='bg-red-950/50 border border-red-800 rounded-lg px-4 py-3'>
            <p className='text-red-400 text-sm'>{error}</p>
          </div>
        )}
 
        <Button
          onClick={handleLogin}
          disabled={loading}
          className='w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base mt-2'
        >
          {loading ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' /> Logging in...</> : 'Login to Dashboard'}
        </Button>
 
      </CardContent>
    </Card>
  )
}