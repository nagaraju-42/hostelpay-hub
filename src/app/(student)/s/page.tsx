'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ── Google 'G' Logo SVG ────────────────────────────────────────────────────
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

// ── Spinner ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(255,255,255,0.3)',
        borderTopColor: '#F59E0B',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  )
}

export default function StudentLandingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get('next') || '/s'
  const hasError = searchParams.get('error') === 'auth_failed'

  const [checking, setChecking] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        try {
          const res = await fetch('/api/student/me?t=' + Date.now(), { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            if (json.data?.approval_status === 'pending') {
              router.replace('/s/pending')
            } else if (json.data?.approval_status === 'rejected') {
              router.replace('/s/join')
            } else {
              router.replace('/s/dashboard')
            }
          } else if (res.status === 404) {
            router.replace('/s/join')
          } else {
            setChecking(false)
          }
        } catch {
          setChecking(false)
        }
      } else {
        setChecking(false)
      }
    })
  }, [router])

  async function handleGoogleSignIn() {
    setSigningIn(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`,
      },
    })
    // Page will redirect; keep signingIn true
  }

  async function handlePhoneLogin(e: React.FormEvent) {
    e.preventDefault()
    setPhoneError('')
    if (!phone || !password) {
      setPhoneError('Please enter both phone number and password.')
      return
    }
    setPhoneLoading(true)
    try {
      const res = await fetch('/api/student/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Login failed')
      }
      router.replace(nextParam)
    } catch (err: any) {
      setPhoneError(err.message)
      setPhoneLoading(false)
    }
  }

  if (checking) {
    return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(160deg, #0F2744 0%, #1a3a5c 100%)',
            gap: 16,
          }}
        >
          <Spinner />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: '"DM Sans", sans-serif', fontSize: 14 }}>
            Checking session…
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
        .google-btn:hover { box-shadow: 0 6px 20px rgba(15,39,68,0.15) !important; transform: translateY(-1px); }
        .google-btn:active { transform: translateY(0); }
        .google-btn { transition: all 0.2s ease; }
      `}</style>

      {/* ── Hero Section ── */}
      <div
        style={{
          background: 'linear-gradient(160deg, #0F2744 0%, #1a3a5c 60%, #0F2744 100%)',
          paddingTop: 64,
          paddingBottom: 52,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(245,158,11,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(245,158,11,0.05)', pointerEvents: 'none' }} />

        {/* Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'rgba(245,158,11,0.15)',
            border: '1.5px solid rgba(245,158,11,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            animation: 'pulse 3s ease-in-out infinite',
            backdropFilter: 'blur(4px)',
          }}
        >
          🏨
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', animation: 'fadeUp 0.5s ease 0.1s both' }}>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 28,
              color: '#fff',
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            HostelPay Hub
          </h1>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: '#F59E0B',
              margin: '6px 0 0',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Student Portal
          </p>
        </div>
      </div>

      {/* ── White Card ── */}
      <div
        style={{
          flex: 1,
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          marginTop: -16,
          padding: '32px 24px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          animation: 'fadeUp 0.45s ease 0.2s both',
        }}
      >
        {/* Error alert */}
        {hasError && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 18 }}>⚠️</span>
            <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#DC2626', lineHeight: 1.5 }}>
              Sign-in failed. Please try again. If the issue persists, contact your hostel owner.
            </p>
          </div>
        )}

        {/* Heading */}
        <div>
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 24,
              color: '#0F2744',
              margin: '0 0 8px',
            }}
          >
            Welcome, student 👋
          </h2>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              color: '#64748B',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Sign in to view your payment status and hostel details.
          </p>
        </div>

        {/* ── Phone Login Form ── */}
        <form onSubmit={handlePhoneLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {phoneError && (
            <div style={{ color: '#DC2626', fontSize: 13, fontFamily: '"DM Sans", sans-serif', background: '#FEF2F2', padding: '10px', borderRadius: '8px' }}>
              {phoneError}
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6, fontFamily: '"DM Sans", sans-serif' }}>
              PHONE NUMBER
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: '"DM Sans", sans-serif', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6, fontFamily: '"DM Sans", sans-serif' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: '"DM Sans", sans-serif', fontSize: 14 }}
            />
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif' }}>
              Hint: Default password is your Hostel OTP
            </p>
          </div>

          <button
            type="submit"
            disabled={phoneLoading}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, background: '#F59E0B', color: '#fff', 
              border: 'none', fontWeight: 700, fontSize: 15, cursor: phoneLoading ? 'not-allowed' : 'pointer',
              opacity: phoneLoading ? 0.7 : 1, marginTop: 4, fontFamily: '"DM Sans", sans-serif'
            }}
          >
            {phoneLoading ? 'Signing in...' : 'Log in with Phone'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif', textTransform: 'uppercase', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        </div>

        {/* Google Sign-in Button */}
        <button
          id="google-signin-btn"
          className="google-btn"
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            width: '100%',
            padding: '15px 20px',
            background: '#fff',
            border: '1.5px solid #E2E8F0',
            borderRadius: 14,
            boxShadow: '0 2px 8px rgba(15,39,68,0.08)',
            cursor: signingIn ? 'not-allowed' : 'pointer',
            opacity: signingIn ? 0.7 : 1,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: '#0F2744',
          }}
        >
          {signingIn ? (
            <>
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: '2px solid #E2E8F0',
                  borderTopColor: '#0F2744',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Signing you in…
            </>
          ) : (
            <>
              <GoogleLogo />
              Continue with Google
            </>
          )}
        </button>

        {/* Divider + footnote */}
        <div style={{ marginTop: 4, textAlign: 'center' }}>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              color: '#94A3B8',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            New here? You&apos;ll be guided to join your hostel after sign in.
          </p>
        </div>

        {/* Trust indicators */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 8,
            justifyContent: 'center',
          }}
        >
          {[
            { icon: '🔒', text: 'Secure' },
            { icon: '📱', text: 'Easy' },
            { icon: '⚡', text: 'Instant' },
          ].map(({ icon, text }) => (
            <div
              key={text}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 10,
                  color: '#94A3B8',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link
            href="/support"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              color: '#185FA5',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Need help? Contact Support
          </Link>
        </div>
      </div>
    </>
  )
}
