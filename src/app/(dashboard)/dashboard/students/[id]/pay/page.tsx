'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TopBar } from '@/components/mobile/TopBar'
import { MobileAvatar, initialsFromName, colorFromName } from '@/components/mobile/MobileAvatar'
import { format } from 'date-fns'
import type { StudentWithPayments } from '@/types'
import { getPendingMonths, type PendingMonth, getTodayIST } from '@/lib/utils/due-calc'

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

  const [student,    setStudent]    = useState<StudentWithPayments | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [mode,       setMode]       = useState<PaymentMode>('upi')
  const [modeLabel,  setModeLabel]  = useState('UPI')
  const [payDate,    setPayDate]    = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes,      setNotes]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const [pendingMonths, setPendingMonths] = useState<PendingMonth[]>([])
  const [selectedMonths, setSelectedMonths] = useState<PendingMonth[]>([])
  const [customAmountStr, setCustomAmountStr] = useState('')

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then(r => r.json())
      .then(({ data }) => { 
        setStudent(data)
        
        // Calculate pending months
        const pending = getPendingMonths(
          data.rent_amount, 
          data.monthly_due_day, 
          data.date_of_joining, 
          data.payments,
          getTodayIST()
        )
        setPendingMonths(pending)
        
        // Auto-select the oldest pending month by default
        if (pending.length > 0) {
          setSelectedMonths([pending[0]])
        } else {
          setCustomAmountStr(String(data.rent_amount))
        }
        
        setLoading(false) 
      })
      .catch(() => router.push('/dashboard/students'))
  }, [id])

  const toggleMonthSelection = (month: PendingMonth) => {
    setSelectedMonths(prev => {
      const exists = prev.find(m => m.monthName === month.monthName)
      if (exists) return prev.filter(m => m.monthName !== month.monthName)
      return [...prev, month]
    })
  }

  const finalAmount = pendingMonths.length > 0
    ? selectedMonths.reduce((sum, m) => sum + m.amountOwed, 0)
    : Number(customAmountStr)

  async function handleConfirm() {
    if (!student) return
    if (finalAmount <= 0) {
      toast.error('Please select an amount to pay')
      return
    }
    
    setSubmitting(true)
    
    let generatedNotes = notes.trim()
    if (pendingMonths.length > 0 && selectedMonths.length > 0) {
      const monthNames = selectedMonths.map(m => m.monthName).join(', ')
      generatedNotes = `Paid for: ${monthNames}${notes ? ` | ${notes}` : ''}`
    }

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id:   student.id,
        amount_paid:  finalAmount,
        payment_mode: mode,
        notes:        generatedNotes || undefined,
        date:         payDate,
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
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>Total Amount Paying</div>
            <div style={{ fontSize: 42, fontWeight: 700, fontFamily: '"DM Serif Display", serif', letterSpacing: -1, marginTop: 4, color: '#1E293B' }}>
              ₹{finalAmount.toLocaleString('en-IN')}
            </div>
            {pendingMonths.length > 0 ? (
              <div style={{ fontSize: 12, color: '#DC2626', fontFamily: '"DM Sans", sans-serif', marginTop: 8, fontWeight: 600 }}>
                ⚠️ {pendingMonths.length} month(s) overdue
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#059669', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>✅ Fully up to date. Paying in advance.</div>
            )}
          </div>

          {/* Form */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 18, WebkitOverflowScrolling: 'touch' }}>

            {/* Pending Months Selection OR Custom Input */}
            {pendingMonths.length > 0 ? (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 9 }}>SELECT MONTHS TO PAY</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pendingMonths.map(month => {
                    const isSelected = selectedMonths.some(m => m.monthName === month.monthName)
                    return (
                      <div 
                        key={month.monthName}
                        onClick={() => toggleMonthSelection(month)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '14px 16px', borderRadius: 12,
                          border: isSelected ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                          background: isSelected ? '#FEF3C7' : '#F8FAFC',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ 
                            width: 20, height: 20, borderRadius: 6, 
                            background: isSelected ? '#F59E0B' : '#fff',
                            border: isSelected ? 'none' : '1px solid #CBD5E1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {isSelected && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 15, fontWeight: isSelected ? 600 : 500, color: '#1E293B', fontFamily: '"DM Sans", sans-serif' }}>
                            {month.monthName}
                          </span>
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', fontFamily: '"DM Serif Display", serif' }}>
                          ₹{month.amountOwed.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 6 }}>AMOUNT TO PAY</div>
                <input
                  type="number"
                  value={customAmountStr}
                  onChange={e => setCustomAmountStr(e.target.value)}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    border: '1px solid #E2E8F0', background: '#F8FAFC',
                    fontSize: 18, fontFamily: '"DM Sans", sans-serif', color: '#1E293B',
                    boxSizing: 'border-box', fontWeight: 600
                  }}
                />
              </div>
            )}

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
              disabled={submitting || finalAmount <= 0}
              style={{
                background: (submitting || finalAmount <= 0) ? '#D97706' : '#F59E0B',
                color: '#111',
                border: 'none', padding: '15px', borderRadius: 12,
                fontSize: 18, fontWeight: 700,
                fontFamily: '"DM Sans", sans-serif',
                cursor: (submitting || finalAmount <= 0) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginBottom: 24, minHeight: 50,
                opacity: (submitting || finalAmount <= 0) ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {submitting ? 'Processing…' : `✅ Confirm payment — ₹${finalAmount.toLocaleString('en-IN')}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
