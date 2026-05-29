'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PendingApprovalPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  async function checkStatus() {
    setChecking(true)
    try {
      const res = await fetch(`/api/student/me?t=${Date.now()}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (json.data?.approval_status === 'approved') {
          router.replace('/s/dashboard')
        } else if (json.data?.approval_status === 'rejected') {
          router.replace('/s/join')
        }
      }
    } finally {
      setChecking(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/s')
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #0F2744 0%, #1a3a5c 100%)',
          padding: 24,
          textAlign: 'center',
        }}
      >
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
            animation: 'pulse 2.5s ease-in-out infinite',
            marginBottom: 24,
          }}
        >
          ⏳
        </div>
        
        <h1 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 28, color: '#fff', margin: '0 0 12px' }}>
          Waiting for Approval
        </h1>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 32px', lineHeight: 1.6, maxWidth: 300 }}>
          Your request to join the hostel has been sent. The hostel owner must approve you before you can access the dashboard.
        </p>

        <button
          onClick={checkStatus}
          disabled={checking}
          style={{
            background: '#F59E0B',
            color: '#0F2744',
            border: 'none',
            padding: '16px 24px',
            borderRadius: 14,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 16,
            fontWeight: 700,
            cursor: checking ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            maxWidth: 260,
            justifyContent: 'center',
          }}
        >
          {checking ? (
            <div style={{ width: 18, height: 18, border: '2px solid rgba(15,39,68,0.3)', borderTopColor: '#0F2744', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : '🔄 Check Status'}
        </button>

        <button
          onClick={handleSignOut}
          style={{
            background: 'none',
            color: '#94A3B8',
            border: 'none',
            padding: '16px',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 16,
            textDecoration: 'underline',
          }}
        >
          Sign out
        </button>
      </div>
    </>
  )
}
