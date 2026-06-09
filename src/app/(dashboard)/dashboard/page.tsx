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
    { icon: '➕', label: 'Add student',    bg: '#EFF6FF', txt: '#2563EB', href: '/dashboard/students/new' },
    { icon: '⚠️', label: 'Pending dues',   bg: '#EFF6FF', txt: '#2563EB', href: '/dashboard/pending-dues' },
    { icon: '👥', label: 'All students',   bg: '#EFF6FF', txt: '#2563EB', href: '/dashboard/students'    },
    { icon: '📥', label: 'Export report',  bg: '#EFF6FF', txt: '#2563EB', href: '/dashboard/export'      },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#F8FAFC' }}>

      {/* ── Top Bar ── */}
      <div style={{
        background: '#FFFFFF',
        padding: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ fontSize: 20, color: '#1E293B', cursor: 'pointer' }}>≡</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif', fontWeight: 500 }}>
            {greeting}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1E293B', fontFamily: '"DM Sans", sans-serif' }}>
            {hostelName}
          </div>
        </div>
        <NotificationBell />
      </div>

      {/* ── Scrollable Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const }}>

        {/* ── Alert Banner ── */}
        {totalDue > 0 && (
          <div style={{ padding: '16px 16px 0' }}>
            <button
              onClick={() => router.push('/dashboard/pending-dues')}
              style={{
                width: '100%', textAlign: 'left',
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #FECACA',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.06)',
                padding: '16px', display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer',
              }}
            >
              <div style={{ color: '#DC2626', fontSize: 24 }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', fontFamily: '"DM Sans", sans-serif' }}>
                  {totalDue} payment{totalDue > 1 ? 's' : ''} due today
                </div>
                <div style={{ fontSize: 13, color: '#DC2626', fontFamily: '"DM Sans", sans-serif', fontWeight: 600, marginTop: 4 }}>
                  Tap to view &amp; collect →
                </div>
              </div>
              <div style={{ color: '#DC2626', fontSize: 16, fontWeight: 'bold' }}>›</div>
            </button>
          </div>
        )}

        {/* ── Stats Row ── */}
        <div style={{ padding: '20px 16px', display: 'flex', gap: 10 }}>
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ flex: 1, height: 76, background: '#E2E8F0', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
              ))}
            </>
          ) : (
            <>
              {/* Custom stat blocks matching the mockup */}
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '12px 8px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#2563EB', fontFamily: '"DM Sans", sans-serif' }}>{totalStudents}</div>
                <div style={{ fontSize: 10, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>Total students</div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '12px 8px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981', fontFamily: '"DM Sans", sans-serif' }}>{collectedMTD}</div>
                <div style={{ fontSize: 10, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>Collected MTD</div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '12px 8px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#EF4444', fontFamily: '"DM Sans", sans-serif' }}>{dueToday.length}</div>
                <div style={{ fontSize: 10, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>Due today</div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '12px 8px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#F59E0B', fontFamily: '"DM Sans", sans-serif' }}>{pendingCount}</div>
                <div style={{ fontSize: 10, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>Pending</div>
              </div>
            </>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ padding: '0 16px 20px' }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: '#1E293B',
            marginBottom: 12, fontFamily: '"DM Sans", sans-serif',
          }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {QUICK_ACTIONS.map(q => (
              <button
                key={q.label}
                onClick={() => router.push(q.href)}
                style={{
                  background: q.bg, color: q.txt, border: 'none',
                  borderRadius: 12, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: '"DM Sans", sans-serif',
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
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', fontFamily: '"DM Sans", sans-serif' }}>
              Recent Payments
            </div>
            <div
              onClick={() => router.push('/dashboard/history')}
              style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif' }}
            >
              View all
            </div>
          </div>

          {loading ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid #E2E8F0' }}>
              {[...Array(2)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: i === 0 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ width: 44, height: 44, background: '#E2E8F0', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: 130, background: '#E2E8F0', borderRadius: 6, marginBottom: 6 }} />
                    <div style={{ height: 12, width: 90,  background: '#F1F5F9', borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0',
              padding: '32px 16px', textAlign: 'center',
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
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '14px 0',
                      borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
                    }}
                  >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                        <div style={{
                          width: 36, height: 36, background: '#ECFDF5',
                          borderRadius: 8, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 16, flexShrink: 0,
                          border: '1px solid #A7F3D0'
                        }}>💸</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', color: '#1E293B' }}>{name}</div>
                          <div style={{ fontSize: 12, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginTop: 2 }}>
                            Room {room} • Paid on {paidAt}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981', fontFamily: '"DM Sans", sans-serif' }}>
                        {amt}
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