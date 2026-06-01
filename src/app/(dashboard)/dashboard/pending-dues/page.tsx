'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { TopBar } from '@/components/mobile/TopBar'
import { MobileAvatar, initialsFromName, colorFromName } from '@/components/mobile/MobileAvatar'
import type { PendingDueStudent } from '@/app/api/payments/pending-dues/route'

export const dynamic = 'force-dynamic'

type Tab = 'overdue' | 'due_today' | 'upcoming' | 'paid'

export default function PendingDuesPage() {
  const router = useRouter()
  const [students, setStudents] = useState<PendingDueStudent[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<Tab>('overdue')
  const [search, setSearch]     = useState('')

  async function fetchDues() {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/pending-dues')
      const { data } = await res.json()
      setStudents(data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDues() }, [])

  // Aggregate stats
  const stats = useMemo(() => {
    const overdue   = students.filter(s => s.status === 'overdue')
    const dueToday  = students.filter(s => s.status === 'due_today')
    const upcoming  = students.filter(s => s.status === 'upcoming')
    const paid      = students.filter(s => s.status === 'paid')
    const totalOwed = students.reduce((sum, s) => sum + s.total_owed, 0)
    const totalCollected = paid.reduce((sum, s) => sum + s.rent_amount, 0)
    return { overdue, dueToday, upcoming, paid, totalOwed, totalCollected }
  }, [students])

  // Filter by tab + search
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return students
      .filter(s => s.status === tab)
      .filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.room_number.toLowerCase().includes(q) ||
        s.phone.includes(q)
      )
  }, [students, tab, search])

  // WhatsApp message
  function openWhatsApp(s: PendingDueStudent, toParent = false) {
    const phone = toParent && s.parent_phone ? s.parent_phone : s.phone
    const cleanPhone = phone.replace(/\D/g, '')
    const countryPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
    const months = s.months_unpaid > 1 ? `${s.months_unpaid} months` : '1 month'
    const msg = toParent
      ? `Dear Parent, this is a reminder that the hostel rent for ${s.full_name} (Room ${s.room_number}) of ₹${s.total_owed.toLocaleString('en-IN')} is pending for ${months}. Kindly ensure payment at the earliest. Thank you.`
      : `Hi ${s.full_name.split(' ')[0]}, your hostel rent of ₹${s.total_owed.toLocaleString('en-IN')} is pending for ${months}. Room ${s.room_number}. Please pay at your earliest convenience. Thank you.`
    window.open(`https://wa.me/${countryPhone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function callPhone(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`tel:+91${cleanPhone}`, '_self')
  }

  const TABS: { key: Tab; label: string; count: number; emoji: string; bg: string; activeBg: string; txt: string }[] = [
    { key: 'overdue',   label: 'Overdue',   count: stats.overdue.length,  emoji: '🔴', bg: '#FEF2F2', activeBg: '#DC2626', txt: '#991B1B' },
    { key: 'due_today', label: 'Due Today', count: stats.dueToday.length, emoji: '🟡', bg: '#FEF3C7', activeBg: '#D97706', txt: '#92400E' },
    { key: 'upcoming',  label: 'Upcoming',  count: stats.upcoming.length, emoji: '🔵', bg: '#EFF6FF', activeBg: '#2563EB', txt: '#1E40AF' },
    { key: 'paid',      label: 'Paid',      count: stats.paid.length,     emoji: '🟢', bg: '#ECFDF5', activeBg: '#059669', txt: '#065F46' },
  ]

  const fmtMoney = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar
        title="Pending Dues"
        sub={format(new Date(), 'EEE, d MMM yyyy')}
        backHref="/dashboard"
      />

      {/* ── Big Summary Card ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F2744 0%, #1a3a5c 100%)',
        padding: '18px 16px 20px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Sans", sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}>
              Total Pending
            </div>
            <div style={{
              fontSize: 42, fontWeight: 700, color: stats.totalOwed > 0 ? '#F87171' : '#34D399',
              fontFamily: '"DM Serif Display", serif', lineHeight: 1.1, marginTop: 2,
            }}>
              {loading ? '…' : fmtMoney(stats.totalOwed)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Sans", sans-serif' }}>
              Collected this month
            </div>
            <div style={{
              fontSize: 26, fontWeight: 700, color: '#34D399',
              fontFamily: '"DM Serif Display", serif',
            }}>
              {loading ? '…' : fmtMoney(stats.totalCollected)}
            </div>
          </div>
        </div>

        {/* Mini stat pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {[
            { label: 'Overdue', val: stats.overdue.length, col: '#F87171' },
            { label: 'Due Today', val: stats.dueToday.length, col: '#FBBF24' },
            { label: 'Upcoming', val: stats.upcoming.length, col: '#60A5FA' },
            { label: 'Paid', val: stats.paid.length, col: '#34D399' },
          ].map((p, i) => (
            <div key={i} style={{
              flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 10,
              padding: '8px 6px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: p.col, fontFamily: '"DM Serif Display", serif' }}>
                {loading ? '…' : p.val}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontFamily: '"DM Sans", sans-serif', marginTop: 1 }}>
                {p.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 16px',
        overflowX: 'auto', flexShrink: 0,
        background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
        scrollbarWidth: 'none',
      }}>
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                background: active ? t.activeBg : t.bg,
                color: active ? '#fff' : t.txt,
                fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                transition: 'all 0.15s',
              }}
            >
              {t.emoji} {t.label} ({loading ? '…' : t.count})
            </button>
          )
        })}
      </div>

      {/* ── Search ── */}
      <div style={{ padding: '8px 16px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 12px', borderRadius: 10,
          border: '1px solid #E2E8F0', background: '#fff',
        }}>
          <span style={{ fontSize: 14, opacity: 0.5 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, room, phone…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 12, fontFamily: '"DM Sans", sans-serif', color: '#1E293B',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 12 }}>✕</button>
          )}
        </div>
      </div>

      {/* ── Student List ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', WebkitOverflowScrolling: 'touch' }}>

        {loading ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 14px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0',
                borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none',
              }}>
                <div style={{ width: 44, height: 44, background: '#E2E8F0', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, width: 130, background: '#E2E8F0', borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ height: 11, width: 90,  background: '#F1F5F9', borderRadius: 6 }} />
                </div>
                <div style={{ height: 32, width: 70, background: '#E2E8F0', borderRadius: 8 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: 14, border: '1px dashed #E2E8F0',
            padding: '40px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>
              {tab === 'paid' ? '🎉' : tab === 'overdue' ? '✅' : '📋'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#334155', fontFamily: '"DM Sans", sans-serif' }}>
              {tab === 'paid' ? 'No payments collected yet' :
               tab === 'overdue' ? 'No overdue payments!' :
               search ? `No match for "${search}"` :
               'No students in this category'}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>
              {tab === 'overdue' ? 'All students are up to date 🙌' : ''}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(s => {
              const initials = initialsFromName(s.full_name)
              const col = colorFromName(s.full_name)
              const isOverdue = s.status === 'overdue'
              const isPaid = s.status === 'paid'

              return (
                <div
                  key={s.id}
                  style={{
                    background: '#fff', borderRadius: 14,
                    border: isOverdue ? '1px solid #FECACA' : '1px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: isOverdue ? '0 2px 8px rgba(220,38,38,0.08)' : 'none',
                  }}
                >
                  {/* Main row */}
                  <div
                    style={{
                      padding: '14px 14px 10px',
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      cursor: 'pointer',
                    }}
                    onClick={() => router.push(`/dashboard/students/${s.id}`)}
                  >
                    <MobileAvatar initials={initials} color={col} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                          color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {s.full_name}
                        </div>
                        {s.months_unpaid > 1 && (
                          <span style={{
                            fontSize: 9, fontWeight: 800, background: '#DC2626', color: '#fff',
                            borderRadius: 4, padding: '1px 5px', lineHeight: '14px',
                          }}>
                            {s.months_unpaid}M
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginTop: 1 }}>
                        Room {s.room_number} · ₹{s.rent_amount.toLocaleString('en-IN')}/mo
                      </div>
                      {s.last_paid_at ? (
                        <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif', marginTop: 2 }}>
                          Last paid: {format(new Date(s.last_paid_at), 'd MMM yyyy')}
                          {s.days_since_payment !== null && s.days_since_payment > 30 && (
                            <span style={{ color: '#DC2626', fontWeight: 600 }}> · {s.days_since_payment}d ago</span>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: 10, color: '#DC2626', fontFamily: '"DM Sans", sans-serif', fontWeight: 600, marginTop: 2 }}>
                          Never paid
                        </div>
                      )}
                    </div>

                    {/* Amount owed */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontSize: isPaid ? 16 : 26, fontWeight: 700,
                        color: isPaid ? '#059669' : '#DC2626',
                        fontFamily: '"DM Serif Display", serif',
                      }}>
                        {isPaid ? '✅' : `₹${s.total_owed.toLocaleString('en-IN')}`}
                      </div>
                      {!isPaid && s.months_unpaid > 0 && (
                        <div style={{ fontSize: 9, color: '#991B1B', fontFamily: '"DM Sans", sans-serif', marginTop: 1 }}>
                          {s.months_unpaid} month{s.months_unpaid > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons row */}
                  {!isPaid && (
                    <div style={{
                      display: 'flex', gap: 6, padding: '0 14px 12px',
                      borderTop: 'none',
                    }}>
                      {/* WhatsApp Student */}
                      <button
                        onClick={(e) => { e.stopPropagation(); openWhatsApp(s) }}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8,
                          padding: '8px 4px', cursor: 'pointer',
                          fontSize: 11, fontWeight: 600, color: '#065F46',
                          fontFamily: '"DM Sans", sans-serif',
                        }}
                      >
                        📱 WhatsApp
                      </button>

                      {/* Call */}
                      <button
                        onClick={(e) => { e.stopPropagation(); callPhone(s.phone) }}
                        style={{
                          flex: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8,
                          padding: '8px 4px', cursor: 'pointer',
                          fontSize: 11, fontWeight: 600, color: '#1E40AF',
                          fontFamily: '"DM Sans", sans-serif',
                        }}
                      >
                        📞 Call
                      </button>

                      {/* WhatsApp Parent (if available) */}
                      {s.parent_phone && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openWhatsApp(s, true) }}
                          style={{
                            flex: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8,
                            padding: '8px 4px', cursor: 'pointer',
                            fontSize: 10, fontWeight: 600, color: '#92400E',
                            fontFamily: '"DM Sans", sans-serif',
                          }}
                        >
                          👤 Parent
                        </button>
                      )}

                      {/* Mark Paid */}
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/students/${s.id}/pay`) }}
                        style={{
                          flex: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          background: '#0F2744', border: 'none', borderRadius: 8,
                          padding: '8px 4px', cursor: 'pointer',
                          fontSize: 11, fontWeight: 700, color: '#fff',
                          fontFamily: '"DM Sans", sans-serif',
                        }}
                      >
                        ✅ Paid
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
