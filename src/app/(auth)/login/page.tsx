'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin() {
    setError('')
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    })
    if (authError) {
      setError(
        authError.message.includes('Invalid login credentials')
          ? 'Wrong email or password. Please try again.'
          : 'Login failed. Please check your connection and try again.'
      )
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ── Header ── */}
      <div style={{
        padding: '60px 24px 30px',
        textAlign: 'center',
        background: '#fff',
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64,
          background: '#EFF6FF',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 32,
        }}>
          🏨
        </div>

        <div style={{
          fontSize: 24,
          fontWeight: 700,
          fontFamily: '"DM Sans", sans-serif',
          color: '#1E293B',
          letterSpacing: '-0.5px',
        }}>
          Sign in to HostelPay Hub
        </div>

        <div style={{
          fontSize: 14,
          color: '#64748B',
          marginTop: 8,
          fontFamily: '"DM Sans", sans-serif',
        }}>
          Enter your registered email and password to continue
        </div>
      </div>

      {/* ── Form ── */}
      <div style={{
        padding: '0 24px 24px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        background: '#fff',
      }}>

        {/* Phone / Email */}
        <div>
          <div style={{
            fontSize: 11, color: '#64748B',
            fontFamily: '"DM Sans", sans-serif',
            marginBottom: 6, fontWeight: 600, letterSpacing: '0.5px',
          }}>
            PHONE / EMAIL
          </div>
          <div style={{
            padding: '12px 14px',
            borderRadius: 12,
            border: email ? `2px solid #0F2744` : '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex', alignItems: 'center', gap: 9,
          }}>
            <span>📱</span>
            <input
              id="email"
              type="email"
              placeholder="+91 98765 43210 or email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoComplete="email"
              suppressHydrationWarning
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 14, fontFamily: '"DM Sans", sans-serif',
                color: '#1E293B',
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div style={{
            fontSize: 11, color: '#64748B',
            fontFamily: '"DM Sans", sans-serif',
            marginBottom: 6, fontWeight: 600, letterSpacing: '0.5px',
          }}>
            PASSWORD
          </div>
          <div style={{
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex', alignItems: 'center', gap: 9,
          }}>
            <span>🔒</span>
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoComplete="current-password"
              suppressHydrationWarning
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 14, fontFamily: '"DM Sans", sans-serif',
                color: '#1E293B',
              }}
            />
            <button
              type="button"
              aria-label={showPw ? 'Hide password' : 'Show password'}
              onClick={() => setShowPw(!showPw)}
              suppressHydrationWarning
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 }}
            >
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div style={{ textAlign: 'right', marginTop: -8 }}>
          <span style={{ fontSize: 12, color: '#185FA5', fontFamily: '"DM Sans", sans-serif', cursor: 'pointer' }}>
            Forgot password?
          </span>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 10, padding: '10px 14px',
          }}>
            <p style={{ color: '#991B1B', fontSize: 13, fontFamily: '"DM Sans", sans-serif' }}>{error}</p>
          </div>
        )}

        {/* CTA */}
        <button
          id="login-btn"
          onClick={handleLogin}
          disabled={loading}
          suppressHydrationWarning
          style={{
            background: loading ? '#93C5FD' : '#2563EB',
            color: '#fff',
            border: 'none',
            padding: '16px',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: '"DM Sans", sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.2s',
            minHeight: 52,
          }}
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging in…</>
            : <>Continue</>
          }
        </button>

        {/* Footer */}
        <div style={{ marginTop: 'auto', textAlign: 'center', paddingTop: 24 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif', padding: '0 20px', lineHeight: 1.5 }}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    </div>
  )
}