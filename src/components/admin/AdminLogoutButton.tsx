'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AdminLogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        marginTop: 12,
        width: '100%',
        background: 'rgba(239, 68, 68, 0.1)',
        color: '#EF4444',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        padding: '8px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: '"DM Sans", sans-serif',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {loading ? 'Logging out...' : '🚪 Log Out'}
    </button>
  )
}
