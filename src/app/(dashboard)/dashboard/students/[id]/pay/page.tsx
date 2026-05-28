'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TopBar } from '@/components/mobile/TopBar'
import { MobileAvatar, initialsFromName, colorFromName } from '@/components/mobile/MobileAvatar'
import { format } from 'date-fns'
import type { Student } from '@/types'

type PaymentMode = 'upi' | 'cash' | 'bank'

const PAYMENT_MODES: { mode: PaymentMode; icon: string; label: string }[] = [
  { mode: 'upi',  icon: '📱', label: 'UPI'           },
  { mode: 'cash', icon: '💵', label: 'Cash'          },
  { mode: 'bank', icon: '🏦', label: 'Bank transfer' },
  { mode: 'bank', icon: '💳', label: 'Cheque'        },
]

export default function RecordPaymentPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [student,    setStudent]    = useState<Student | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [mode,       setMode]       = useState<PaymentMode>('upi')
  const [modeLabel,  setModeLabel]  = useState('UPI')
  const [payDate,    setPayDate]    = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes,      setNotes]      = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then(r => r.json())
      .then(({ data }) => { setStudent(data); setLoading(false) })
      .catch(() => router.push('/dashboard/students'))
  }, [id])

  async function handleConfirm() {
    if (!student) return
    setSubmitting(true)
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id:   student.id,
        amount_paid:  Number(student.rent_amount),
        payment_mode: mode,
        notes:        notes.trim() || undefined,
      }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      toast.error(data.error || 'Failed to record payment.')
      return
    }
    toast.success('Payment recorded successfully!')
    router.push(`/dashboard/students/${id}`)
  }

  const initials    = student ? initialsFromName(student.full_name) : '--'
  const avatarColor = student ? colorFromName(student.full_name) : 'blue'

  const getDaySuffix = (d: number) => {
    if (d >= 11 && d <= 13) return 'th'
    return ['th','st','nd','rd'][(d % 10 < 4) ? d % 10 : 0]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar title="Record payment" backHref={`/dashboard/students/${id}`} />

      {loading ? (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[80, 120, 160].map((h, i) => (<div key={i} style={{ height: h, background: '#E2E8F0', borderRadius: 14 }} />))}
        </div>
      ) : student && (
        <>
          {/* Student mini-hero */}
          <div style={{
            background: 'linear-gradient(160deg, #0F2744 0%, #163354 100%)',
            padding: '14px 20px 30px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <MobileAvatar initials={initials} color={avatarColor} size={46} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 400, color: '#fff', fontFamily: '"DM Serif Display", serif' }}>{student.full_name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Sans", sans-serif' }}>
                  Room {student.room_number} · Due: {student.monthly_due_day}{getDaySuffix(student.monthly_due_day)}
                </div>
              </div>
            </div>
          </div>

          {/* Amount card */}
          <div style={{ margin: '-14px 16px 0', background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '18px', textAlign: 'center', position: 'relative', zIndex: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>Amount due</div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: '"DM Serif Display", serif', letterSpacing: -1, marginTop: 4, color: '#1E293B' }}>
              ₹{Number(student.rent_amount).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 11, color: '#059669', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>✅ No overdue penalties</div>
          </div>

          {/* Form */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 14, WebkitOverflowScrolling: 'touch' }}>

            {/* Payment Mode */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 9 }}>PAYMENT MODE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PAYMENT_MODES.map(m => {
                  const isActive = modeLabel === m.label
                  return (
                    <button
                      key={m.label}
                      onClick={() => { setMode(m.mode); setModeLabel(m.label) }}
                      style={{
                        padding: '11px 12px', borderRadius: 12,
                        border: isActive ? '2px solid #0F2744' : '1px solid #E2E8F0',
                        background: isActive ? '#EEF2FF' : '#F8FAFC',
                        display: 'flex', alignItems: 'center', gap: 8,
                        cursor: 'pointer', textAlign: 'left',
                        minHeight: 44,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{m.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? '#0F2744' : '#64748B', fontFamily: '"DM Sans", sans-serif' }}>{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 6 }}>PAYMENT DATE</div>
              <input
                type="date"
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  border: '1px solid #E2E8F0', background: '#F8FAFC',
                  fontSize: 14, fontFamily: '"DM Sans", sans-serif', color: '#64748B',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Notes */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 6 }}>NOTES (OPTIONAL)</div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add a note…"
                rows={2}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  border: '1px solid #E2E8F0', background: '#F8FAFC',
                  fontSize: 14, fontFamily: '"DM Sans", sans-serif', color: '#1E293B',
                  resize: 'none', boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>

            {/* Confirm CTA */}
            <button
              onClick={handleConfirm}
              disabled={submitting}
              style={{
                background: submitting ? '#D97706' : '#F59E0B',
                color: '#111',
                border: 'none', padding: '15px', borderRadius: 12,
                fontSize: 14, fontWeight: 700,
                fontFamily: '"DM Sans", sans-serif',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginBottom: 24, minHeight: 50,
                opacity: submitting ? 0.8 : 1,
                transition: 'all 0.2s',
              }}
            >
              {submitting ? 'Processing…' : `✅ Confirm payment — ₹${Number(student.rent_amount).toLocaleString('en-IN')}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
