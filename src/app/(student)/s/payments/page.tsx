'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { StudentBottomNav } from '@/components/mobile/StudentBottomNav'
import type { Student, Payment, OwnerPublicInfo } from '@/types'

// ── Receipt PDF generator ──────────────────────────────────────────────────
async function downloadReceipt(payment: Payment, student: Student, hostelName: string) {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })

  // Header
  doc.setFillColor(15, 39, 68)
  doc.rect(0, 0, 148, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Receipt', 14, 20)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('HostelPay Hub', 14, 30)

  // Receipt ID chip
  doc.setFillColor(245, 158, 11)
  doc.roundedRect(88, 13, 50, 10, 2, 2, 'F')
  doc.setTextColor(15, 39, 68)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`#${payment.id.slice(0, 8).toUpperCase()}`, 91, 19.5)

  // Body
  doc.setTextColor(30, 30, 30)
  const rows: [string, string][] = [
    ['Hostel',   hostelName],
    ['Student',  student.full_name],
    ['Room',     student.room_number],
    ['Amount',   `Rs. ${payment.amount_paid.toLocaleString('en-IN')}`],
    ['Mode',     payment.payment_mode.toUpperCase()],
    ['Date',     format(new Date(payment.paid_at), 'd MMM yyyy')],
    ...(payment.notes ? [['Notes', payment.notes] as [string, string]] : []),
  ]

  let y = 55
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(label, 14, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 39, 68)
    doc.text(value, 14, y + 6)
    y += 18
  })

  // Footer
  doc.setDrawColor(226, 232, 240)
  doc.line(14, y + 5, 134, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text('This is a computer-generated receipt. No signature required.', 14, y + 12)

  doc.save(`Receipt-${payment.id.slice(0, 8)}.pdf`)
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

// ── Mode Badge ─────────────────────────────────────────────────────────────
function ModeBadge({ mode }: { mode: string }) {
  const map: Record<string, { color: string; bg: string; icon: string }> = {
    cash: { color: '#16A34A', bg: '#F0FDF4', icon: '💵' },
    upi:  { color: '#7C3AED', bg: '#F5F3FF', icon: '📱' },
    bank: { color: '#1D4ED8', bg: '#EFF6FF', icon: '🏦' },
  }
  const style = map[mode] || { color: '#64748B', bg: '#F8FAFC', icon: '💰' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 20,
        background: style.bg,
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 10,
        fontWeight: 700,
        color: style.color,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
      }}
    >
      {style.icon} {mode}
    </span>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
interface MeResponse {
  data: Student & { owner: OwnerPublicInfo }
}

interface PaymentsResponse {
  data: Payment[]
}

export default function StudentPaymentsPage() {
  const router = useRouter()
  const [meData, setMeData] = useState<MeResponse | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/s'); return }
      loadData()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [meRes, paymentsRes] = await Promise.all([
        fetch('/api/student/me?t=' + Date.now(), { cache: 'no-store' }),
        fetch('/api/student/payments'),
      ])
      if (meRes.status === 401) { router.replace('/s'); return }
      if (meRes.status === 404) { router.replace('/s/join'); return }
      if (meRes.ok) {
        const meJson = await meRes.json()
        if (meJson.data?.approval_status === 'pending') {
          router.replace('/s/pending')
          return
        }
        setMeData(meJson)
      }
      if (paymentsRes.ok) {
        const pJson: PaymentsResponse = await paymentsRes.json()
        setPayments(pJson.data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadReceipt(payment: Payment) {
    if (!meData) return
    setDownloadingId(payment.id)
    try {
      await downloadReceipt(payment, meData.data, meData.data.owner.hostel_name)
    } catch (err) {
      console.error('Failed to generate receipt', err)
    } finally {
      setDownloadingId(null)
    }
  }

  const owner = meData?.data?.owner

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .receipt-btn:hover { background: #0F2744 !important; color: #fff !important; }
        .receipt-btn { transition: all 0.2s ease; }
      `}</style>

      {/* ── TopBar ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F2744 0%, #163354 100%)',
          padding: '20px 16px 18px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: '"DM Serif Display", serif',
            fontSize: 18,
            color: '#fff',
          }}
        >
          Payments 💳
        </p>
      </div>

      {/* ── Content ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          animation: loading ? undefined : 'fadeUp 0.4s ease both',
        }}
      >
        {/* ── QR Section ── */}
        <section>
          <h2
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
            Pay Rent
          </h2>

          {loading ? (
            <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <Skeleton width={200} height={200} radius={12} />
              <Skeleton width="60%" height={14} radius={6} />
              <Skeleton width="40%" height={12} radius={6} />
            </div>
          ) : owner?.payment_qr_url ? (
            <div
              style={{
                background: '#fff',
                border: '1.5px solid #E2E8F0',
                borderLeft: '4px solid #F59E0B',
                borderRadius: 16,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: '"DM Serif Display", serif',
                  fontSize: 18,
                  color: '#0F2744',
                  alignSelf: 'flex-start',
                }}
              >
                Pay your hostel rent
              </p>
              <div
                style={{
                  padding: 12,
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: 16,
                  boxShadow: '0 4px 16px rgba(15,39,68,0.08)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={owner.payment_qr_url}
                  alt="Payment QR Code"
                  style={{ width: '100%', maxWidth: 260, borderRadius: 8, display: 'block' }}
                />
              </div>
              {owner.payment_qr_note && (
                <div
                  style={{
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: 10,
                    padding: '10px 14px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      color: '#92400E',
                      lineHeight: 1.5,
                    }}
                  >
                    📝 {owner.payment_qr_note}
                  </p>
                </div>
              )}
              <p
                style={{
                  margin: 0,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  color: '#94A3B8',
                  textAlign: 'center',
                }}
              >
                Scan with any UPI app · PhonePe, GPay, Paytm, etc.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: '#F8FAFC',
                border: '1.5px dashed #CBD5E1',
                borderRadius: 16,
                padding: '28px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 36 }}>🔲</span>
              <p
                style={{
                  margin: 0,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#64748B',
                  textAlign: 'center',
                }}
              >
                QR code not set yet
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: '#94A3B8',
                  textAlign: 'center',
                }}
              >
                Contact your hostel owner to set up a payment QR code.
              </p>
            </div>
          )}
        </section>

        {/* ── Payment History ── */}
        <section>
          <h2
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
            Payment History
          </h2>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Skeleton width={120} height={16} radius={6} />
                    <Skeleton width={80} height={12} radius={4} />
                  </div>
                  <Skeleton width={70} height={30} radius={8} />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div
              style={{
                background: '#F8FAFC',
                border: '1.5px dashed #CBD5E1',
                borderRadius: 16,
                padding: '36px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 40 }}>📭</span>
              <p
                style={{
                  margin: 0,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#64748B',
                  textAlign: 'center',
                }}
              >
                No payments recorded yet
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: '#94A3B8',
                  textAlign: 'center',
                  lineHeight: 1.5,
                }}
              >
                Your owner will record your payments here. Check back after paying.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: 14,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {/* Left icon */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#F0FDF4',
                      border: '1px solid #86EFAC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    ✅
                  </div>

                  {/* Middle */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: '0 0 4px',
                        fontFamily: '"DM Serif Display", serif',
                        fontSize: 18,
                        color: '#0F2744',
                      }}
                    >
                      ₹{payment.amount_paid.toLocaleString('en-IN')}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 11,
                          color: '#94A3B8',
                        }}
                      >
                        {format(new Date(payment.paid_at), 'd MMM yyyy')}
                      </span>
                      <ModeBadge mode={payment.payment_mode} />
                    </div>
                    {payment.notes && (
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 11,
                          color: '#94A3B8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {payment.notes}
                      </p>
                    )}
                  </div>

                  {/* Receipt button */}
                  <button
                    id={`receipt-btn-${payment.id.slice(0, 8)}`}
                    className="receipt-btn"
                    onClick={() => handleDownloadReceipt(payment)}
                    disabled={downloadingId === payment.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '7px 10px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 8,
                      cursor: downloadingId === payment.id ? 'not-allowed' : 'pointer',
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#64748B',
                      flexShrink: 0,
                      opacity: downloadingId === payment.id ? 0.6 : 1,
                    }}
                    title="Download receipt PDF"
                  >
                    {downloadingId === payment.id ? (
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          border: '2px solid #CBD5E1',
                          borderTopColor: '#0F2744',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                    ) : (
                      <>📄 PDF</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Bottom Nav ── */}
      <StudentBottomNav />
    </>
  )
}
