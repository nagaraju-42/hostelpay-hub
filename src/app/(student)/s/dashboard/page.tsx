'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { StudentBottomNav } from '@/components/mobile/StudentBottomNav'
import { StatusBadge } from '@/components/mobile/StatusBadge'
import { calculateLedger, getPaymentStatus, getTodayIST } from '@/lib/utils/due-calc'
import type { Student, Payment, OwnerPublicInfo } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFirstName(name: string): string {
  return name.split(' ')[0]
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ width, height, radius = 8 }: { width: string | number; height: number; radius?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  )
}

// ── Info Chip ──────────────────────────────────────────────────────────────
function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 10,
            fontWeight: 700,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: '"DM Serif Display", serif',
          fontSize: 18,
          color: '#0F2744',
        }}
      >
        {value}
      </p>
    </div>
  )
}

// ── Dashboard Page ─────────────────────────────────────────────────────────
interface MeResponse {
  data: Student & { owner: OwnerPublicInfo }
}

export default function StudentDashboardPage() {
  const router = useRouter()

  const [meData, setMeData] = useState<MeResponse | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      // NOTE: We also allow custom session cookie, so we don't strictly block here if session is null.
      // loadData() will fail 401 if unauthorized.
      loadData()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [meRes, paymentsRes] = await Promise.all([
        fetch('/api/student/me', { cache: 'no-store' }),
        fetch('/api/student/payments'),
      ])

      if (meRes.status === 401) { router.replace('/s'); return }
      if (meRes.status === 404) { router.replace('/s/join'); return }
      if (!meRes.ok) throw new Error('Failed to load profile')

      const meJson: MeResponse = await meRes.json()
      if (meJson.data?.approval_status === 'pending') {
        router.replace('/s/pending')
        return
      }
      setMeData(meJson)

      if (paymentsRes.ok) {
        const pJson = await paymentsRes.json()
        setPayments(pJson.data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const student = meData?.data
  const hostel_name = student?.owner?.hostel_name
  const lastPayment = payments.length > 0 ? payments[0] : null
  
  let ledger = null
  let pStatus = null
  
  if (student) {
    const today = getTodayIST()
    ledger = calculateLedger(
      student.rent_amount,
      student.monthly_due_day,
      student.date_of_joining,
      payments,
      today
    )
    pStatus = getPaymentStatus(student.rent_amount, student.monthly_due_day, student.date_of_joining, payments, today)
  }

  function getBadgeType(s: string) {
    if (s === 'paid') return 'green'
    if (s === 'due_today') return 'amber'
    if (s === 'overdue') return 'red'
    return 'blue'
  }

  function getBadgeLabel(s: string) {
    if (s === 'paid') return 'Paid this month ✅'
    if (s === 'due_today') return 'Due today ⚠️'
    if (s === 'overdue') return 'Overdue 🔴'
    return 'Upcoming ⏳'
  }


  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── TopBar ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F2744 0%, #163354 100%)',
          padding: '18px 16px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <Skeleton width={120} height={14} />
          ) : (
            <p
              style={{
                margin: 0,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {getGreeting()},
            </p>
          )}
          {loading ? (
            <div style={{ marginTop: 6 }}><Skeleton width={160} height={20} /></div>
          ) : (
            <p
              style={{
                margin: '4px 0 0',
                fontFamily: '"DM Serif Display", serif',
                fontSize: 20,
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {getFirstName(student?.full_name || '')} 👋
            </p>
          )}
        </div>

        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#0F2744',
            flexShrink: 0,
            cursor: 'pointer',
          }}
          onClick={() => router.push('/s/profile')}
        >
          {student ? student.full_name.slice(0, 1).toUpperCase() : '?'}
        </div>
      </div>

      {/* ── Main content ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          animation: loading ? undefined : 'fadeUp 0.4s ease both',
        }}
      >
        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 12,
              padding: '12px 16px',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: '#DC2626',
            }}
          >
            {error}{' '}
            <button
              onClick={loadData}
              style={{ background: 'none', border: 'none', color: '#DC2626', textDecoration: 'underline', cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', fontSize: 13 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Status Hero Card ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F2744 0%, #1a3a5c 60%, #163354 100%)',
            borderRadius: 20,
            padding: '22px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* decorative */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(245,158,11,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, left: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton width={140} height={14} radius={6} />
              <Skeleton width={120} height={36} radius={6} />
              <Skeleton width={100} height={22} radius={10} />
            </div>
          ) : (
            <>
              <p
                style={{
                  margin: '0 0 4px',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Your Hostel
              </p>
              <p
                style={{
                  margin: '0 0 10px',
                  fontFamily: '"DM Serif Display", serif',
                  fontSize: 22,
                  color: '#fff',
                }}
              >
                {hostel_name}
              </p>

              {/* Rent */}
              <p
                style={{
                  margin: '0 0 14px',
                  fontFamily: '"DM Serif Display", serif',
                  fontSize: 40,
                  color: '#F59E0B',
                  lineHeight: 1,
                }}
              >
                ₹{student?.rent_amount.toLocaleString('en-IN') || '—'}
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.4)',
                    marginLeft: 6,
                    fontWeight: 400,
                  }}
                >
                  /month
                </span>
              </p>

              {/* Status badge */}
              {ledger && pStatus && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <StatusBadge label={getBadgeLabel(pStatus)} type={getBadgeType(pStatus) as any} />
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      Due {getOrdinal(student?.monthly_due_day || 5)} of every month
                    </span>
                  </div>
                  {(ledger.totalOwed > 0 || ledger.monthsUnpaid > 0) && (
                    <div style={{ background: 'rgba(255,0,0,0.1)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,0,0,0.2)' }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#FECACA', fontFamily: '"DM Sans", sans-serif' }}>
                        Total Owed: <strong style={{ color: '#fff' }}>₹{ledger.totalOwed.toLocaleString('en-IN')}</strong> ({ledger.monthsUnpaid.toFixed(1)} months unpaid)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Quick Info Grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px 16px' }}>
              <Skeleton width="60%" height={10} radius={4} />
              <div style={{ marginTop: 8 }}><Skeleton width="80%" height={18} radius={4} /></div>
            </div>
            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px 16px' }}>
              <Skeleton width="60%" height={10} radius={4} />
              <div style={{ marginTop: 8 }}><Skeleton width="80%" height={18} radius={4} /></div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InfoChip icon="🚪" label="Room" value={student?.room_number || '—'} />
            <InfoChip
              icon="📅"
              label="Member since"
              value={student?.date_of_joining ? format(new Date(student.date_of_joining), 'MMM yyyy') : '—'}
            />
          </div>
        )}

        {/* ── Contact Owner ── */}
        {!loading && student?.owner?.phone && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button
              onClick={() => window.open(`tel:${student.owner.phone}`)}
              style={{
                background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE',
                borderRadius: 14, padding: '12px', fontSize: 13, fontWeight: 700,
                fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              <span style={{ fontSize: 16 }}>📞</span> Call Owner
            </button>
            <button
              onClick={() => window.open(`https://wa.me/91${student.owner.phone}`, '_blank')}
              style={{
                background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0',
                borderRadius: 14, padding: '12px', fontSize: 13, fontWeight: 700,
                fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              <span style={{ fontSize: 16 }}>💬</span> WhatsApp
            </button>
          </div>
        )}

        {/* ── Last Payment Card ── */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '16px',
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 700,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Recent Payment
          </p>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton width="70%" height={16} />
              <Skeleton width="50%" height={13} />
            </div>
          ) : lastPayment ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p
                  style={{
                    margin: '0 0 4px',
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: 20,
                    color: '#16A34A',
                  }}
                >
                  ₹{lastPayment.amount_paid.toLocaleString('en-IN')}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    color: '#64748B',
                  }}
                >
                  {format(new Date(lastPayment.paid_at), 'd MMM yyyy')} · {lastPayment.payment_mode.toUpperCase()}
                </p>
              </div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#F0FDF4',
                  border: '1px solid #86EFAC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                ✅
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                📭
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: '#94A3B8',
                }}
              >
                No payments recorded yet
              </p>
            </div>
          )}
        </div>

        {/* ── Tip Card ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '1px solid #FDE68A',
            borderRadius: 16,
            padding: '16px',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: 24, flexShrink: 0 }}>💡</span>
          <p
            style={{
              margin: 0,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: '#92400E',
              lineHeight: 1.6,
            }}
          >
            Go to the <strong>Payments</strong> tab to see your hostel&apos;s payment QR code and your full payment history. 💳
          </p>
        </div>
      </div>

      {/* ── Bottom Nav ── */}
      <StudentBottomNav />
    </>
  )
}
