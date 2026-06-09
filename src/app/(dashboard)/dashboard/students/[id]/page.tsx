'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { TopBar } from '@/components/mobile/TopBar'
import { MobileAvatar, initialsFromName, colorFromName } from '@/components/mobile/MobileAvatar'
import { StatusBadge, statusToBadgeType, statusLabel } from '@/components/mobile/StatusBadge'
import { EditStudentSheet } from '@/components/students/EditStudentSheet'
import { AddManualChargeSheet } from '@/components/students/AddManualChargeSheet'
import { RecordPaymentSheet } from '@/components/students/RecordPaymentSheet'
import type { StudentWithPayments } from '@/types'
import { generateStudentLedger, getTodayIST, getPaymentStatus, getNextDueDate } from '@/lib/utils/due-calc'
import { downloadStudentLedgerPDF } from '@/lib/utils/pdf'

// ── Inline CopyButton component ───────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Phone number copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        background: 'none',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        padding: '3px 8px',
        cursor: 'pointer',
        fontSize: 11,
        color: copied ? '#059669' : '#64748B',
        fontFamily: '"DM Sans", sans-serif',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
        transition: 'color 0.2s, border-color 0.2s',
        borderColor: copied ? '#A7F3D0' : '#E2E8F0',
      }}
      title="Copy phone number"
    >
      {copied ? '✅' : '📋'} {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [student,      setStudent]      = useState<StudentWithPayments | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [editOpen,     setEditOpen]     = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [approving,    setApproving]    = useState(false)
  const [rejecting,    setRejecting]    = useState(false)
  const [showChargeSheet, setShowChargeSheet] = useState(false)
  const [showPaymentSheet, setShowPaymentSheet] = useState(false)

  async function fetchStudent() {
    const res = await fetch(`/api/students/${id}`)
    if (!res.ok) { router.push('/dashboard/students'); return }
    const { data } = await res.json()
    setStudent(data)
    setLoading(false)
  }

  useEffect(() => { fetchStudent() }, [id])

  async function handleDeactivate() {
    const defaultDate = new Date().toISOString().split('T')[0]
    const dateStr = prompt(`Enter the date ${student?.full_name} left the hostel (YYYY-MM-DD):`, defaultDate)
    if (dateStr === null) return // user cancelled
    const finalDate = dateStr.trim() || defaultDate

    setDeactivating(true)
    const res = await fetch(`/api/students/${id}?date_of_leaving=${finalDate}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Student marked as Left Hostel.')
      router.push('/dashboard/students')
    } else {
      toast.error('Failed to update student status.')
      setDeactivating(false)
    }
  }

  async function handleApprove() {
    setApproving(true)
    const res = await fetch(`/api/students/${id}/approve`, { method: 'PATCH' })
    if (res.ok) {
      toast.success('Student approved!')
      fetchStudent()
    } else {
      toast.error('Failed to approve student.')
    }
    setApproving(false)
  }

  async function handleReject() {
    if (!confirm(`Are you sure you want to reject ${student?.full_name}? This will delete their pending request.`)) return
    setRejecting(true)
    const res = await fetch(`/api/students/${id}/approve`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Student rejected.')
      router.push('/dashboard/students')
    } else {
      toast.error('Failed to reject student.')
      setRejecting(false)
    }
  }

  async function handleDeletePayment(paymentId: string) {
    if (!confirm('Are you sure you want to delete this payment?')) return
    const res = await fetch(`/api/payments/${paymentId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Payment deleted.')
      fetchStudent()
    } else {
      toast.error('Failed to delete payment.')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <TopBar title="Student profile" backHref="/dashboard/students" />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[120, 200, 160].map((h, i) => (
          <div key={i} style={{ height: h, background: '#E2E8F0', borderRadius: 14 }} />
        ))}
      </div>
    </div>
  )

  if (!student) return null

  const initials    = initialsFromName(student.full_name)
  const avatarColor = colorFromName(student.full_name)

  const getDaySuffix = (d: number) => {
    if (d >= 11 && d <= 13) return 'th'
    return ['th','st','nd','rd'][(d % 10 < 4) ? d % 10 : 0]
  }

  async function handleDownloadLedger() {
    if (!student) return
    const ledger = generateStudentLedger(
      student.rent_amount,
      student.monthly_due_day,
      student.date_of_joining,
      student.payments,
      getTodayIST(),
      student.date_of_leaving,
      student.manual_charges
    )
    await downloadStudentLedgerPDF(
      id,
      'Hostel Statement',
      student.full_name,
      student.room_number,
      student.date_of_joining,
      student.rent_amount,
      ledger
    )
  }

  const today = getTodayIST()
  const joinDate = new Date(student.date_of_joining)
  const refDate = today < joinDate ? joinDate : today

  const nextDue = getNextDueDate(student.monthly_due_day, refDate)
  const nextDueStr = format(nextDue, 'd MMM')

  const payStatus = getPaymentStatus(
    student.rent_amount,
    student.monthly_due_day,
    student.date_of_joining,
    student.payments,
    today,
    student.date_of_leaving,
    student.manual_charges
  )
  const badgeType = statusToBadgeType(payStatus)
  const badgeLbl  = statusLabel(payStatus)

  // WhatsApp message
  const whatsappMsg = encodeURIComponent(
    `Hi ${student.full_name}, your hostel rent of ₹${student.rent_amount} is due on the ${student.monthly_due_day}${getDaySuffix(student.monthly_due_day)} of this month. Please arrange payment at the earliest. - your hostel`
  )
  const whatsappUrl = `https://wa.me/91${student.phone.replace(/\D/g, '')}?text=${whatsappMsg}`

  // Contact rows with optional copyable flag
  const CONTACT_ROWS: { icon: string; val: string; copyable?: boolean }[] = [
    { icon: '📱', val: student.phone, copyable: true },
    ...(student.parent_phone ? [{ icon: '👤', val: `Parent: ${student.parent_phone}` }] : []),
    { icon: '📧', val: student.email },
    ...(student.aadhaar_number ? [{ icon: '🪪', val: `Aadhar: XXXX XXXX ${student.aadhaar_number.slice(-4)}` }] : []),
    ...(student.address ? [{ icon: '🏠', val: student.address }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar
        title="Student profile"
        backHref="/dashboard/students"
        right={
          student.approval_status !== 'pending' && (
            <button
              onClick={() => setEditOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: 8, width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 16,
              }}
            >✏️</button>
          )
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(160deg, #0F2744 0%, #163354 100%)',
          padding: '20px 22px 32px',
          textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <MobileAvatar initials={initials} color={avatarColor} size={70} />
          <div style={{ fontSize: 17, fontWeight: 400, color: '#fff', fontFamily: '"DM Serif Display", serif', marginTop: 10 }}>
            {student.full_name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Sans", sans-serif', marginTop: 3 }}>
            Room {student.room_number} · Joined {format(new Date(student.date_of_joining), 'd MMM yyyy')}
          </div>
          <div style={{ marginTop: 10 }}>
            {!student.is_active ? (
              <StatusBadge label={`Left Hostel on ${student.date_of_leaving ? format(new Date(student.date_of_leaving), 'd MMM yyyy') : 'Unknown'}`} type="red" />
            ) : student.approval_status === 'pending' ? (
              <StatusBadge label="Pending Approval" type="purple" />
            ) : (
              <StatusBadge label={`Active · ${badgeLbl}`} type={badgeType} />
            )}
          </div>
        </div>

        {/* Floating Info Card */}
        <div style={{
          margin: '-14px 16px 0',
          background: '#fff', borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '14px 18px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'relative', zIndex: 2,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          {[
            { lbl: 'Monthly rent', val: `₹${Number(student.rent_amount).toLocaleString('en-IN')}`, col: '#0F2744' },
            { lbl: 'Next due',     val: nextDueStr,  col: '#059669' },
            { lbl: 'Cycle day',    val: `${student.monthly_due_day}${getDaySuffix(student.monthly_due_day)}`, col: '#0F2744' },
          ].map((item, idx) => (
            <div key={idx} style={{
              textAlign: 'center', flex: 1,
              borderRight: idx < 2 ? '1px solid #F1F5F9' : 'none',
            }}>
              <div style={{ fontSize: 10, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>{item.lbl}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: item.col, fontFamily: '"DM Serif Display", serif', marginTop: 2 }}>{item.val}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Contact Details */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 11, fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px' }}>
              CONTACT DETAILS
            </div>
            {CONTACT_ROWS.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 0',
                borderBottom: i < CONTACT_ROWS.length - 1 ? '1px solid #F8FAFC' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <span style={{ fontSize: 15 }}>{c.icon}</span>
                  <span style={{ fontSize: 13, fontFamily: '"DM Sans"', color: '#334155', flex: 1 }}>{c.val}</span>
                  {c.copyable && <CopyButton text={c.val} />}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleDownloadLedger}
            style={{
              background: '#0F2744', color: '#fff',
              border: 'none', padding: '14px', borderRadius: 12,
              fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 50, marginTop: 4, width: '100%'
            }}
          >
            📄 Download Ledger PDF
          </button>
          {student.approval_status === 'pending' ? (
            <div style={{ background: '#F3E8FF', borderRadius: 14, border: '1px solid #D8B4FE', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6B21A8', fontFamily: '"DM Sans", sans-serif' }}>
                ACTION REQUIRED
              </div>
              <p style={{ fontSize: 12, color: '#6B21A8', fontFamily: '"DM Sans", sans-serif', margin: 0 }}>
                This student self-registered and is waiting for your approval to access the hostel portal.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={handleApprove}
                  disabled={approving || rejecting}
                  style={{
                    flex: 1, background: '#7E22CE', color: '#fff', border: 'none',
                    borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700,
                    fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                    opacity: approving ? 0.7 : 1,
                  }}
                >
                  {approving ? 'Approving…' : '✅ Approve Student'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={approving || rejecting}
                  style={{
                    flex: 1, background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA',
                    borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700,
                    fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                    opacity: rejecting ? 0.7 : 1,
                  }}
                >
                  {rejecting ? 'Rejecting…' : '❌ Reject'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Action Buttons — 3 buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {/* Mark Paid */}
            <button
              onClick={() => setShowPaymentSheet(true)}
              style={{ flex: 1, padding: 12, background: '#0F2744', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <div style={{ fontSize: 18 }}>✅</div>
              <div style={{ fontSize: 12 }}>Mark Paid</div>
            </button>
            {/* Add Charge */}
            <button
              onClick={() => setShowChargeSheet(true)}
              style={{
                background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA',
                borderRadius: 12, padding: '13px 6px', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                minHeight: 54, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 4, flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 18 }}>✏️</span>
              <span>Add Charge</span>
            </button>
            {/* WhatsApp */}
            <button
              onClick={() => window.open(whatsappUrl, '_blank')}
              style={{
                background: '#ECFDF5', color: '#065F46',
                border: '1px solid #A7F3D0',
                borderRadius: 12, padding: '13px 6px', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                minHeight: 54, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 4, flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 18 }}>💬</span>
              <span>WhatsApp</span>
            </button>
            {/* History */}
            <button
              onClick={() => router.push(`/dashboard/history`)}
              style={{
                background: '#F8FAFC', color: '#334155',
                border: '1px solid #E2E8F0',
                borderRadius: 12, padding: '13px 6px', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                minHeight: 54, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 4, flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 18 }}>📋</span>
              <span>History</span>
            </button>
          </div>

          {/* Recent Payments */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 9, fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px' }}>
              RECENT PAYMENTS
            </div>
            {student.payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif' }}>
                No payments recorded yet
              </div>
            ) : (
              student.payments.slice(0, 5).map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 0',
                  borderBottom: i < Math.min(student.payments.length, 5) - 1 ? '1px solid #F1F5F9' : 'none',
                }}>
                  <div style={{
                    width: 34, height: 34, background: '#ECFDF5',
                    borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
                  }}>₹</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', color: '#1E293B' }}>
                      {p.notes?.replace('Paid for: ', '') || format(new Date(p.paid_at), 'MMMM yyyy')}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>
                      {p.payment_mode.toUpperCase()} · Paid on {format(new Date(p.paid_at), 'd MMM yyyy')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', fontFamily: '"DM Serif Display", serif' }}>
                      ₹{Number(p.amount_paid).toLocaleString('en-IN')}
                    </div>
                    <button
                      onClick={() => handleDeletePayment(p.id)}
                      style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', opacity: 0.6 }}
                      title="Delete payment"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Leave Hostel Zone */}
          {student.is_active && (
            <div style={{ background: '#FEF2F2', borderRadius: 14, border: '1px solid #FECACA', padding: '14px 16px', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', fontFamily: '"DM Sans", sans-serif', marginBottom: 4 }}>
                LEFT HOSTEL
              </div>
              <p style={{ fontSize: 11, color: '#B91C1C', fontFamily: '"DM Sans", sans-serif', marginBottom: 10 }}>
                Marking this student as left preserves their payment history for reports, but removes them from active lists.
              </p>
              <button
                onClick={handleDeactivate}
                disabled={deactivating}
                style={{
                  background: '#DC2626', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '10px 16px',
                  fontSize: 12, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                  cursor: deactivating ? 'not-allowed' : 'pointer',
                  opacity: deactivating ? 0.7 : 1,
                }}
              >
                {deactivating ? 'Updating…' : '🚪 Mark as Left Hostel'}
              </button>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      <EditStudentSheet
        student={student}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => { setEditOpen(false); fetchStudent() }}
      />
      <AddManualChargeSheet
        studentId={id}
        open={showChargeSheet}
        onOpenChange={setShowChargeSheet}
        onAdded={fetchStudent}
      />

      <RecordPaymentSheet
        student={student}
        open={showPaymentSheet}
        onOpenChange={setShowPaymentSheet}
        onSuccess={() => { setShowPaymentSheet(false); fetchStudent(); }}
      />
    </div>
  )
}