'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    /*
      Sahara Login Card
      ─────────────────
      • Warm white card on warm linen background (set in auth layout)
      • EB Garamond editorial heading
      • Sienna CTA button
      • No dark mode classes
      • 28px padding (Sahara card spec)
    */
    <div className='w-full max-w-sm mx-4'>
      <div
        className='bg-[#fffcf8] rounded-2xl border border-[rgba(216,208,200,0.70)] shadow-sahara-lg overflow-hidden'
      >

        {/* ── Card Header ── */}
        <div className='px-7 pt-8 pb-6 border-b border-[rgba(216,208,200,0.50)]'>
          {/* Logo mark */}
          <div className='flex items-center gap-3 mb-6'>
            <div className='w-11 h-11 shrink-0 rounded-xl bg-[#c2652a] flex items-center justify-center shadow-sahara'>
              <Building2 className='w-6 h-6 text-[#fffcf8]' />
            </div>
            <div className='min-w-0'>
              <p className='text-[10px] text-[#b0a090] uppercase tracking-[0.14em] font-sans'>
                Welcome to
              </p>
              <p className='text-[#2c1f14] font-heading font-semibold text-lg leading-tight'>
                HostelPayHub
              </p>
            </div>
          </div>

          {/* Editorial heading */}
          <h1 className='font-heading text-2xl font-semibold text-[#2c1f14] leading-tight'>
            Owner Login
          </h1>
          <p className='font-sans text-sm text-[#8a7060] mt-1'>
            Enter the credentials provided by your administrator.
          </p>
        </div>

        {/* ── Card Body ── */}
        <div className='px-7 py-6 space-y-5'>

          <div className='space-y-1.5'>
            <Label
              htmlFor='email'
              className='text-[#5c3d2a] text-sm font-medium font-sans'
            >
              Email Address
            </Label>
            <Input
              id='email'
              type='email'
              placeholder='owner@example.com'
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className='space-y-1.5'>
            <Label
              htmlFor='password'
              className='text-[#5c3d2a] text-sm font-medium font-sans'
            >
              Password
            </Label>
            <Input
              id='password'
              type='password'
              placeholder='Enter your password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              disabled={loading}
            />
          </div>

          {/* Error state — warm earthy, not harsh red */}
          {error && (
            <div className='bg-[#f5e8e4] border border-[rgba(140,60,60,0.25)] rounded-lg px-4 py-3'>
              <p className='text-[#8c3c3c] text-sm font-sans'>{error}</p>
            </div>
          )}

          {/* CTA — full-width sienna button, 44px tap target */}
          <Button
            id='login-submit'
            onClick={handleLogin}
            disabled={loading}
            size='lg'
            className='w-full font-semibold text-base mt-1'
          >
            {loading
              ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' /> Logging in...</>
              : 'Login to Dashboard'}
          </Button>

        </div>
      </div>

      {/* Footer note */}
      <p className='text-center text-xs text-[#b0a090] mt-5 font-sans'>
        HostelPayHub · Secure Access
      </p>
    </div>
  )
}