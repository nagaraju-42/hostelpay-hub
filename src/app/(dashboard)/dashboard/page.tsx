'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { MobileAvatar, initialsFromName, colorFromName } from '@/components/mobile/MobileAvatar'
import { StatCard } from '@/components/mobile/StatCard'
import { StatusBadge } from '@/components/mobile/StatusBadge'
import { NotificationBell } from '@/components/mobile/NotificationBell'
import type { DueTodayStudent } from '@/app/api/payments/due-today/route'
import type { Payment } from '@/types'

export const dynamic = 'force-dynamic'

interface DashSummary { total_amount: number; total_count: number }
interface RecentPayment extends Payment { student_name: string; room_number: string }

export default function DashboardPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [hostelName, setHostelName]     = useState('My Hostel')
  const [ownerName,  setOwnerName]      = useState('')
  const [dueToday,   setDueToday]       = useState<DueTodayStudent[]>([])
  const [overdue,    setOverdue]        = useState<DueTodayStudent[]>([])
  const [summary,    setSummary]        = useState<DashSummary | null>(null)
  const [totalStudents, setTotalStudents] = useState(0)
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [loading,    setLoading]        = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Fetch owner info
      const { data: owner } = await supabase
        .from('hostel_owners')
        .select('hostel_name, full_name')
        .eq('id', user.id)
        .single()
      if (owner) {
        setHostelName(owner.hostel_name ?? 'My Hostel')
        setOwnerName(owner.full_name ?? '')
      }

      // Fetch dashboard data in parallel
      const [dueRes, overdueRes, summaryRes, studRes, payRes] = await Promise.all([
        fetch('/api/payments/due-today'),
        fetch('/api/payments/overdue'),
        fetch('/api/payments/summary'),
        fetch('/api/students'),
        fetch('/api/payments?limit=5'),
      ])
      const [dueData, overdueData, summaryData, studData, payData] = await Promise.all([
        dueRes.json(), overdueRes.json(), summaryRes.json(),
        studRes.json(), payRes.json(),
      ])

      setDueToday(dueData.data   ?? [])
      setOverdue(overdueData.data ?? [])
      setSummary(summaryData.data ?? null)
      setTotalStudents((studData.data ?? []).length)
      setRecentPayments(payData.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => { fetchAll() }, [fetchAll])

  const totalDue    = dueToday.length + overdue.length
  const pendingCount = overdue.length
  const collectedMTD = summary
    ? summary.total_amount >= 100000
      ? `₹${(summary.total_amount / 100000).toFixed(2)}L`
      : `₹${Math.round(summary.total_amount / 1000)}K`
    : '₹0'

  const initials = initialsFromName(ownerName || hostelName)
  const avatarColor = colorFromName(ownerName || hostelName)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning 👋' : hour < 17 ? 'Good afternoon 👋' : 'Good evening 👋'

  const QUICK_ACTIONS = [
    { icon: '➕', label: 'Add student',    bg: '#0F2744', txt: '#fff',     href: '/dashboard/students/new' },
    { icon: '💰', label: 'Pending dues',   bg: '#FEF2F2', txt: '#991B1B',  href: '/dashboard/pending-dues' },
    { icon: '👥', label: 'All students',   bg: '#ECFDF5', txt: '#065F46',  href: '/dashboard/students'    },
    { icon: '📥', label: 'Export report',  bg: '#EDE9FE', txt: '#5B21B6',  href: '/dashboard/export'      },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* ── Top Bar ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F2744 0%, #163354 100%)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Sans", sans-serif' }}>
            {greeting}
          </div>
          <div style={{ fontSize: 16, fontWeight: 400, color: '#fff', fontFamily: '"DM Serif Display", serif' }}>
            {hostelName}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NotificationBell />
          <MobileAvatar initials={initials} color={avatarColor} size={34} />
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const }}>

        {/* ── Alert Banner ── */}
        {totalDue > 0 && (
          <button
            onClick={() => router.push('/dashboard/pending-dues')}
            style={{
              width: '100%', textAlign: 'left',
              background: '#FEF3C7',
              borderTop: 'none', borderRight: 'none', borderBottom: 'none',
              borderLeft: '4px solid #F59E0B',
              padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', fontFamily: '"DM Sans", sans-serif' }}>
                {totalDue} payment{totalDue > 1 ? 's' : ''} due today
              </div>
              <div style={{ fontSize: 11, color: '#92400E', fontFamily: '"DM Sans", sans-serif' }}>
                Tap to view &amp; collect →
              </div>
            </div>
          </button>
        )}

        {/* ── Stats Row ── */}
        <div style={{ padding: '14px 16px', display: 'flex', gap: 9 }}>
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ flex: 1, height: 64, background: '#E2E8F0', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
              ))}
            </>
          ) : (
            <>
              <StatCard value={totalStudents}  label="Total students" color="#0F2744"  />
              <StatCard value={collectedMTD}   label="Collected MTD"  color="#059669"  />
              <StatCard value={dueToday.length} label="Due today"     color="#E24B4A"  />
              <StatCard value={pendingCount}    label="Pending"       color="#F59E0B"  />
            </>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#64748B',
            marginBottom: 9, fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px',
          }}>
            QUICK ACTIONS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            {QUICK_ACTIONS.map(q => (
              <button
                key={q.label}
                onClick={() => router.push(q.href)}
                style={{
                  background: q.bg, color: q.txt, border: 'none',
                  borderRadius: 12, padding: '13px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: '"DM Sans", sans-serif',
                  minHeight: 44, textAlign: 'left',
                  transition: 'transform 0.1s, opacity 0.1s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <span style={{ fontSize: 16 }}>{q.icon}</span>{q.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Recent Payments ── */}
        <div style={{ padding: '0 16px 24px' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#64748B',
            marginBottom: 9, fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px',
          }}>
            RECENT PAYMENTS
          </div>

          {loading ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '16px' }}>
              {[...Array(2)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i === 0 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ width: 40, height: 40, background: '#E2E8F0', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 13, width: 120, background: '#E2E8F0', borderRadius: 6, marginBottom: 4 }} />
                    <div style={{ height: 11, width: 80,  background: '#F1F5F9', borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 14, border: '1px dashed #E2E8F0',
              padding: '24px 16px', textAlign: 'center',
              fontSize: 13, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif',
            }}>
              No payments recorded yet
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 16px' }}>
              {recentPayments.slice(0, 5).map((p, i) => {
                const name  = (p as any).student_name ?? 'Student'
                const room  = (p as any).room_number  ?? '—'
                const paidAt = p.paid_at
                  ? format(new Date(p.paid_at), 'd MMM yyyy')
                  : ''
                const initials   = initialsFromName(name)
                const col        = colorFromName(name)
                const amt        = `+₹${Number(p.amount_paid).toLocaleString('en-IN')}`
                const isLast     = i === recentPayments.slice(0, 5).length - 1
                const monthInfo  = p.notes?.replace('Paid for: ', '') || ''
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '11px 0',
                      borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <MobileAvatar initials={initials} color={col} size={40} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', color: '#1E293B' }}>
                          {name}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                          Room {room} {monthInfo ? `· for ${monthInfo}` : ''}
                        </div>
                        <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif', marginTop: 2 }}>
                          Paid on {paidAt}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', fontFamily: '"DM Serif Display", serif' }}>
                        {amt}
                      </div>
                      <StatusBadge label="Paid" type="green" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}