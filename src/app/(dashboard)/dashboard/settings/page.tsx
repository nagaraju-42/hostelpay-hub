'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/mobile/TopBar'

export default function SettingsPage() {
  const router  = useRouter()
  const supabase = createClient()
  const [hostelName, setHostelName] = useState('')
  const [email,      setEmail]      = useState('')
  const [loading,    setLoading]    = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? '')
      const { data: owner } = await supabase
        .from('hostel_owners')
        .select('hostel_name')
        .eq('id', user.id)
        .single()
      setHostelName(owner?.hostel_name ?? '')
    }
    load()
  }, [supabase, router])

  async function handleLogout() {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const MENU_SECTIONS = [
    {
      title: 'ACCOUNT',
      items: [
        { icon: '🏨', label: 'Hostel name',   sub: hostelName || '—' },
        { icon: '📧', label: 'Email',          sub: email || '—'      },
      ],
    },
    {
      title: 'APP',
      items: [
        { icon: '📤', label: 'Export reports', sub: 'Download payment data', href: '/dashboard/export' },
        { icon: '📊', label: 'Payment history', sub: 'View all transactions',  href: '/dashboard/history' },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        { icon: '💬', label: 'Contact support', sub: 'Get help via WhatsApp' },
        { icon: 'ℹ️',  label: 'App version',     sub: 'HostelPayHub v1.0'     },
      ],
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar title="Settings" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px', WebkitOverflowScrolling: 'touch' as const }}>

        {/* Profile Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0F2744 0%, #163354 100%)',
          borderRadius: 16, padding: '20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#F59E0B', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24, flexShrink: 0,
          }}>
            🏨
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 400, color: '#fff', fontFamily: '"DM Serif Display", serif' }}>
              {hostelName || 'My Hostel'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Sans", sans-serif', marginTop: 2 }}>
              {email || 'Loading…'}
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 8 }}>
              {section.title}
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 16px' }}>
              {section.items.map((item, i) => (
                <div
                  key={i}
                  onClick={() => (item as any).href && router.push((item as any).href)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0',
                    borderBottom: i < section.items.length - 1 ? '1px solid #F1F5F9' : 'none',
                    cursor: (item as any).href ? 'pointer' : 'default',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: '#F8FAFC', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', color: '#1E293B' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>{item.sub}</div>
                  </div>
                  {(item as any).href && <span style={{ color: '#CBD5E1', fontSize: 16 }}>›</span>}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loading}
          style={{
            width: '100%', background: '#FEF2F2',
            border: '1px solid #FECACA', color: '#DC2626',
            borderRadius: 14, padding: '15px',
            fontSize: 14, fontWeight: 700,
            fontFamily: '"DM Sans", sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxSizing: 'border-box',
            opacity: loading ? 0.7 : 1,
            minHeight: 50,
          }}
        >
          {loading ? 'Logging out…' : '🚪 Logout'}
        </button>
      </div>
    </div>
  )
}
