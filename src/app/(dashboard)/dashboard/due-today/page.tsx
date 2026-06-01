'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { TopBar } from '@/components/mobile/TopBar'
import { MobileAvatar, initialsFromName, colorFromName } from '@/components/mobile/MobileAvatar'
import { StatusBadge } from '@/components/mobile/StatusBadge'
import type { DueTodayStudent } from '@/app/api/payments/due-today/route'

export const dynamic = 'force-dynamic'

export default function DueTodayPage() {
  const router = useRouter()
  const [dueStudents,       setDueStudents]       = useState<DueTodayStudent[]>([])
  const [overdueStudents,   setOverdueStudents]   = useState<DueTodayStudent[]>([])
  const [collectedStudents, setCollectedStudents] = useState<DueTodayStudent[]>([])
  const [loading,           setLoading]           = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [dueRes, overdueRes] = await Promise.all([
      fetch('/api/payments/due-today'),
      fetch('/api/payments/overdue'),
    ])
    const [dueData, overdueData] = await Promise.all([dueRes.json(), overdueRes.json()])
    setDueStudents(dueData.data    ?? [])
    setOverdueStudents(overdueData.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const allPending = [...dueStudents, ...overdueStudents]
  const totalExpected = allPending.reduce((sum, s) => sum + Number(s.rent_amount), 0)
  const collectedTotal = collectedStudents.reduce((sum, s) => sum + Number(s.rent_amount), 0)

  const formatAmount = (n: number) =>
    n >= 1000 ? `₹${Math.round(n / 1000)}K` : `₹${n}`

  function markCollected(student: DueTodayStudent) {
    router.push(`/dashboard/students/${student.id}/pay`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar
        title="Due today"
        sub={format(new Date(), 'EEEE, d MMM yyyy')}
        backHref="/dashboard"
      />

      {/* Summary Bar */}
      <div style={{
        background: '#FEF3C7',
        padding: '13px 16px',
        display: 'flex', justifyContent: 'space-around',
        borderBottom: '2px solid #FDE68A',
        flexShrink: 0,
      }}>
        {[
          { val: loading ? '…' : String(allPending.length),           lbl: 'Students due',  col: '#92400E' },
          { val: loading ? '…' : formatAmount(totalExpected),         lbl: 'Expected',      col: '#92400E' },
          { val: loading ? '…' : String(collectedStudents.length),    lbl: 'Collected',     col: '#059669' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.col, fontFamily: '"DM Serif Display", serif' }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#92400E', fontFamily: '"DM Sans", sans-serif' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', WebkitOverflowScrolling: 'touch' as const }}>

        {/* Pending Section */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8, fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px' }}>
          PENDING ({loading ? '…' : allPending.length})
        </div>

        {loading ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 16px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ width: 42, height: 42, background: '#E2E8F0', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 13, width: 130, background: '#E2E8F0', borderRadius: 6, marginBottom: 5 }} />
                  <div style={{ height: 11, width: 90,  background: '#F1F5F9', borderRadius: 6 }} />
                </div>
                <div style={{ height: 32, width: 70, background: '#E2E8F0', borderRadius: 8 }} />
              </div>
            ))}
          </div>
        ) : allPending.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: 14, border: '1px dashed #E2E8F0',
            padding: '24px 16px', textAlign: 'center', marginBottom: 16,
            fontSize: 13, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif',
          }}>
            ✅ No pending payments for today!
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 16px', marginBottom: 16 }}>
            {allPending.map((s, i) => {
              const initials = initialsFromName(s.full_name)
              const col      = colorFromName(s.full_name)
              const isOverdue = s.days_past_due > 0
              const isLast   = i === allPending.length - 1
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '13px 0',
                    borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <MobileAvatar initials={initials} color={col} size={42} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', color: '#1E293B' }}>{s.full_name}</div>
                      <div style={{ fontSize: 11, fontFamily: '"DM Sans", sans-serif', color: isOverdue ? '#991B1B' : '#64748B' }}>
                        Room {s.room_number} · ₹{Number(s.rent_amount).toLocaleString('en-IN')}
                        {isOverdue && ` · ${s.days_past_due} days late`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => markCollected(s)}
                    style={{
                      background: '#0F2744', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '7px 14px',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      fontFamily: '"DM Sans", sans-serif', minHeight: 34, minWidth: 70,
                    }}
                  >
                    Collect
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Collected Section */}
        {collectedStudents.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8, fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px' }}>
              COLLECTED ({collectedStudents.length})
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 16px' }}>
              {collectedStudents.map((s, i) => {
                const initials = initialsFromName(s.full_name)
                const col      = colorFromName(s.full_name)
                const isLast   = i === collectedStudents.length - 1
                return (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '13px 0',
                      borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <MobileAvatar initials={initials} color={col} size={42} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', color: '#1E293B' }}>{s.full_name}</div>
                        <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>Room {s.room_number}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', fontFamily: '"DM Serif Display", serif' }}>
                        ₹{Number(s.rent_amount).toLocaleString('en-IN')}
                      </div>
                      <StatusBadge label="Done" type="green" />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
