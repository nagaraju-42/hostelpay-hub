'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { TopBar } from '@/components/mobile/TopBar'
import { MobileAvatar, initialsFromName, colorFromName } from '@/components/mobile/MobileAvatar'
import { StatusBadge, statusToBadgeType, statusLabel } from '@/components/mobile/StatusBadge'
import { EditStudentSheet } from '@/components/students/EditStudentSheet'
import type { StudentWithPayments } from '@/types'

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [student,     setStudent]     = useState<StudentWithPayments | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [editOpen,    setEditOpen]    = useState(false)
  const [deactivating,setDeactivating]= useState(false)

  async function fetchStudent() {
    const res = await fetch(`/api/students/${id}`)
    if (!res.ok) { router.push('/dashboard/students'); return }
    const { data } = await res.json()
    setStudent(data)
    setLoading(false)
  }

  useEffect(() => { fetchStudent() }, [id])

  async function handleDeactivate() {
    if (!confirm(`Remove ${student?.full_name} from active students? Payment history is preserved.`)) return
    setDeactivating(true)
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Student deactivated.')
      router.push('/dashboard/students')
    } else {
      toast.error('Failed to deactivate student.')
      setDeactivating(false)
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

  const nextDue = new Date()
  const today   = nextDue.getDate()
  if (today > student.monthly_due_day) {
    nextDue.setMonth(nextDue.getMonth() + 1)
  }
  nextDue.setDate(student.monthly_due_day)
  const nextDueStr = format(nextDue, 'd MMM')

  const payStatus = (student as any).payment_status ?? 'upcoming'
  const badgeType = statusToBadgeType(payStatus)
  const badgeLbl  = statusLabel(payStatus)

  const CONTACT_ROWS = [
    { icon: '📱', val: student.phone },
    student.parent_phone ? { icon: '👤', val: `Parent: ${student.parent_phone}` } : null,
    { icon: '📧', val: student.email },
    student.aadhaar_number ? { icon: '🪪', val: `Aadhar: XXXX XXXX ${student.aadhaar_number.slice(-4)}` } : null,
    student.address ? { icon: '🏠', val: student.address } : null,
  ].filter(Boolean) as { icon: string; val: string }[]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar
        title="Student profile"
        backHref="/dashboard/students"
        right={
          <button
            onClick={() => setEditOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: 8, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16,
            }}
          >✏️</button>
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
            <StatusBadge label={`Active · ${badgeLbl}`} type={badgeType} />
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
              <div style={{ fontSize: 16, fontWeight: 700, color: item.col, fontFamily: '"DM Serif Display", serif', marginTop: 2 }}>{item.val}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Contact Details */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 11, fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px' }}>CONTACT DETAILS</div>
            {CONTACT_ROWS.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 0',
                borderBottom: i < CONTACT_ROWS.length - 1 ? '1px solid #F8FAFC' : 'none',
              }}>
                <span style={{ fontSize: 15 }}>{c.icon}</span>
                <span style={{ fontSize: 13, fontFamily: '"DM Sans", sans-serif', color: '#334155' }}>{c.val}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            <button
              onClick={() => router.push(`/dashboard/students/${id}/pay`)}
              style={{
                background: '#0F2744', color: '#fff', border: 'none',
                borderRadius: 12, padding: '13px 8px', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                minHeight: 44,
              }}
            >✅ Mark paid</button>
            <button
              onClick={() => router.push(`/dashboard/history`)}
              style={{
                background: '#F8FAFC', color: '#334155',
                border: '1px solid #E2E8F0',
                borderRadius: 12, padding: '13px 8px', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                minHeight: 44,
              }}
            >📋 History</button>
          </div>

          {/* Recent Payments */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 9, fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px' }}>RECENT PAYMENTS</div>
            {student.payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif' }}>No payments recorded yet</div>
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
                      {format(new Date(p.paid_at), 'MMMM yyyy')}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>
                      {p.payment_mode.toUpperCase()} · {format(new Date(p.paid_at), 'd MMM')}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', fontFamily: '"DM Serif Display", serif' }}>
                    ₹{Number(p.amount_paid).toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Danger Zone */}
          <div style={{ background: '#FEF2F2', borderRadius: 14, border: '1px solid #FECACA', padding: '14px 16px', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', fontFamily: '"DM Sans", sans-serif', marginBottom: 4 }}>DANGER ZONE</div>
            <p style={{ fontSize: 11, color: '#B91C1C', fontFamily: '"DM Sans", sans-serif', marginBottom: 10 }}>
              Deactivating removes this student from active lists. Payment history is never deleted.
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
            >{deactivating ? 'Deactivating…' : '🗑 Deactivate Student'}</button>
          </div>
        </div>
      </div>

      <EditStudentSheet
        student={student}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => { setEditOpen(false); fetchStudent() }}
      />
    </div>
  )
}