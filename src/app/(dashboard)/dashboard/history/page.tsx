'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, subMonths } from 'date-fns'
import { TopBar } from '@/components/mobile/TopBar'
import { MobileAvatar, initialsFromName, colorFromName } from '@/components/mobile/MobileAvatar'
import type { Payment } from '@/types'

interface PaymentWithStudent extends Payment {
  student_name: string
  room_number:  string
}

interface MonthGroup {
  date:    string
  entries: PaymentWithStudent[]
}

export const dynamic = 'force-dynamic'

export default function HistoryPage() {
  const router = useRouter()

  const now         = new Date()
  const monthOptions = [0, 1, 2].map(offset => {
    const d = subMonths(now, offset)
    return { label: format(d, 'MMM yyyy'), value: format(d, 'yyyy-MM') }
  })

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value)
  const [payments,      setPayments]      = useState<PaymentWithStudent[]>([])
  const [loading,       setLoading]       = useState(true)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    const res  = await fetch(`/api/payments/history?month=${selectedMonth}`)
    const data = await res.json()
    setPayments(data.data ?? [])
    setLoading(false)
  }, [selectedMonth])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  // Group by date
  const grouped: MonthGroup[] = []
  const seen = new Set<string>()
  for (const p of payments) {
    const dateKey = format(new Date(p.paid_at), 'd MMM')
    if (!seen.has(dateKey)) {
      seen.add(dateKey)
      grouped.push({ date: dateKey, entries: [] })
    }
    grouped[grouped.length - 1].entries.push(p)
  }

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount_paid), 0)

  const modeIcon = (mode: string) =>
    mode === 'upi' ? '📱' : mode === 'cash' ? '💵' : '🏦'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar
        title="Payment history"
        sub={monthOptions.find(m => m.value === selectedMonth)?.label}
        backHref="/dashboard"
        right={<span style={{ fontSize: 18, cursor: 'pointer' }}>📅</span>}
      />

      {/* Summary Cards */}
      <div style={{
        background: '#F8FAFC', padding: '16px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        flexShrink: 0,
      }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif', fontWeight: 500 }}>Total Collected</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#10B981', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>
            {loading ? '…' : `₹${totalCollected.toLocaleString('en-IN')}`}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif', fontWeight: 500 }}>Entries</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>
            {loading ? '…' : payments.length}
          </div>
        </div>
      </div>

      {/* Month Tabs */}
      <div style={{ padding: '4px 16px', display: 'flex', gap: 8, flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {monthOptions.map(m => (
          <button
            key={m.value}
            onClick={() => setSelectedMonth(m.value)}
            style={{
              padding: '8px 16px', borderRadius: 20, border: '1px solid',
              borderColor: selectedMonth === m.value ? '#0F2744' : '#E2E8F0',
              background: selectedMonth === m.value ? '#0F2744' : '#fff',
              color:      selectedMonth === m.value ? '#fff'    : '#64748B',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif', whiteSpace: 'nowrap'
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Payment List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', WebkitOverflowScrolling: 'touch' as const }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...Array(3)].map((_, gi) => (
              <div key={gi}>
                <div style={{ height: 11, width: 60, background: '#E2E8F0', borderRadius: 6, marginBottom: 7 }} />
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 16px' }}>
                  {[...Array(2)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', borderBottom: i === 0 ? '1px solid #F1F5F9' : 'none' }}>
                      <div style={{ width: 34, height: 34, background: '#E2E8F0', borderRadius: '50%' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 13, width: 120, background: '#E2E8F0', borderRadius: 6, marginBottom: 4 }} />
                        <div style={{ height: 11, width: 80, background: '#F1F5F9', borderRadius: 6 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: 14, border: '1px dashed #E2E8F0',
            padding: '32px 16px', textAlign: 'center',
            fontSize: 13, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif',
          }}>
            No payments in this period
          </div>
        ) : (
          grouped.map((grp, gi) => (
            <div key={gi} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 8, fontFamily: '"DM Sans", sans-serif' }}>
                {grp.date}
              </div>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '0 16px' }}>
                {grp.entries.map((p, i) => {
                  const name     = (p as any).student_name ?? 'Student'
                  const room     = (p as any).room_number  ?? '—'
                  const mode     = p.payment_mode
                  const icon     = modeIcon(mode)
                  const isLast   = i === grp.entries.length - 1
                  const paidTime = p.paid_at ? format(new Date(p.paid_at), 'h:mm a') : ''
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex', alignItems: 'center', padding: '16px 0',
                        borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                        <div style={{
                          width: 36, height: 36, background: '#ECFDF5',
                          borderRadius: 8, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 16, flexShrink: 0,
                          border: '1px solid #A7F3D0'
                        }}>{icon}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', color: '#1E293B' }}>{name}</div>
                          <div style={{ fontSize: 12, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginTop: 2 }}>
                            Room {room} • {mode.toUpperCase()}{paidTime ? ` • ${paidTime}` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981', fontFamily: '"DM Sans", sans-serif' }}>
                        +₹{Number(p.amount_paid).toLocaleString('en-IN')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {/* Export Button */}
        <button
          onClick={() => router.push('/dashboard/export')}
          style={{
            width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0',
            borderRadius: 12, padding: '13px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 13, color: '#64748B', cursor: 'pointer',
            fontFamily: '"DM Sans", sans-serif', marginBottom: 14,
            boxSizing: 'border-box',
          }}
        >
          📊 Export this month&apos;s report
        </button>
      </div>
    </div>
  )
}
