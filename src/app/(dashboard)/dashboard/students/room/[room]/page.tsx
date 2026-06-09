'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopBar } from '@/components/mobile/TopBar'
import { MobileAvatar, initialsFromName, colorFromName } from '@/components/mobile/MobileAvatar'
import { StatusBadge, statusToBadgeType, statusLabel } from '@/components/mobile/StatusBadge'
import { AddStudentSheet } from '@/components/students/AddStudentSheet'
import type { Student } from '@/types'

interface StudentWithStatus extends Student {
  payment_status?: string
  last_paid_at?: string | null
}

function statusDotColor(status?: string): string {
  switch (status) {
    case 'paid':      return '#10B981'
    case 'due_today': return '#F59E0B'
    case 'overdue':   return '#EF4444'
    default:          return '#94A3B8'
  }
}

export default function RoomDetailPage() {
  const params = useParams<{ room: string }>()
  const room   = decodeURIComponent(params.room)
  const router = useRouter()

  const [students,   setStudents]   = useState<StudentWithStatus[]>([])
  const [loading,    setLoading]    = useState(true)
  const [sheetOpen,  setSheetOpen]  = useState(false)

  async function fetchStudents() {
    setLoading(true)
    const res = await fetch('/api/students?withStatus=1')
    const { data } = await res.json()
    const all: StudentWithStatus[] = data ?? []
    setStudents(all.filter(s => s.room_number === room))
    setLoading(false)
  }

  useEffect(() => { fetchStudents() }, [room])

  const counts = {
    paid:      students.filter(s => s.payment_status === 'paid').length,
    due_today: students.filter(s => s.payment_status === 'due_today').length,
    overdue:   students.filter(s => s.payment_status === 'overdue').length,
  }

  const getDaySuffix = (d: number) => {
    if (d >= 11 && d <= 13) return 'th'
    return ['th','st','nd','rd'][(d % 10 < 4) ? d % 10 : 0]
  }

  function whatsappUrl(s: StudentWithStatus) {
    const msg = encodeURIComponent(
      `Hi ${s.full_name}, your hostel rent of ₹${s.rent_amount} is due on the ${s.monthly_due_day}${getDaySuffix(s.monthly_due_day)} of this month. Please arrange payment at the earliest. - your hostel`
    )
    return `https://wa.me/91${s.phone.replace(/\D/g, '')}?text=${msg}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar
        title={`Room ${room}`}
        sub={loading ? '' : `${students.length} student${students.length !== 1 ? 's' : ''}`}
        backHref="/dashboard/students"
      />

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* Room summary bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0F2744 0%, #163354 100%)',
          padding: '12px 16px 20px',
        }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[
              { label: 'Paid',     count: counts.paid,      bg: '#ECFDF5', col: '#065F46' },
              { label: 'Due today',count: counts.due_today, bg: '#FEF3C7', col: '#92400E' },
              { label: 'Overdue',  count: counts.overdue,   bg: '#FEF2F2', col: '#991B1B' },
            ].map((item, i) => (
              <div key={i} style={{
                background: item.bg, borderRadius: 10,
                padding: '6px 14px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: item.col, fontFamily: '"DM Serif Display", serif' }}>
                  {item.count}
                </div>
                <div style={{ fontSize: 10, color: item.col, fontFamily: '"DM Sans", sans-serif', opacity: 0.8 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px 16px 80px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Loading skeletons */}
          {loading && (
            [...Array(3)].map((_, i) => (
              <div key={i} style={{ height: 120, background: '#E2E8F0', borderRadius: 14 }} />
            ))
          )}

          {/* Empty state */}
          {!loading && students.length === 0 && (
            <div style={{
              background: '#fff', borderRadius: 14, border: '1px dashed #E2E8F0',
              padding: '32px 16px', textAlign: 'center',
              fontSize: 13, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif',
            }}>
              No students in Room {room}
            </div>
          )}

          {/* Student cards */}
          {!loading && students.map(s => {
            const initials   = initialsFromName(s.full_name)
            const col        = colorFromName(s.full_name)
            const status     = s.payment_status ?? 'upcoming'
            const badgeType  = statusToBadgeType(status)
            const badgeLbl   = statusLabel(status)

            return (
              <div
                key={s.id}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  padding: '14px 16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}
              >
                {/* Header row: avatar + name + status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <MobileAvatar initials={initials} color={col} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', color: '#1E293B' }}>
                      {s.full_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>
                      {s.phone}
                    </div>
                  </div>
                  <StatusBadge label={badgeLbl} type={badgeType} />
                </div>

                {/* Rent info */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#F8FAFC', borderRadius: 8, padding: '7px 12px',
                  marginBottom: 11,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div
                      style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: statusDotColor(s.payment_status), flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>
                      Due on {s.monthly_due_day}{getDaySuffix(s.monthly_due_day)} each month
                    </span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#0F2744', fontFamily: '"DM Serif Display", serif' }}>
                    ₹{Number(s.rent_amount).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* 3 action buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
                  {/* Call */}
                  <button
                    onClick={() => { window.location.href = `tel:${s.phone}` }}
                    style={{
                      background: '#EFF6FF', color: '#1D4ED8',
                      border: '1px solid #BFDBFE',
                      borderRadius: 10, padding: '10px 4px',
                      fontSize: 11, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 4, minHeight: 40,
                    }}
                  >📱 Call</button>
                  {/* WhatsApp */}
                  <button
                    onClick={() => window.open(whatsappUrl(s), '_blank')}
                    style={{
                      background: '#ECFDF5', color: '#065F46',
                      border: '1px solid #A7F3D0',
                      borderRadius: 10, padding: '10px 4px',
                      fontSize: 11, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 4, minHeight: 40,
                    }}
                  >💬 WhatsApp</button>
                  {/* View Profile */}
                  <button
                    onClick={() => router.push(`/dashboard/students/${s.id}`)}
                    style={{
                      background: '#F8FAFC', color: '#334155',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10, padding: '10px 4px',
                      fontSize: 11, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 4, minHeight: 40,
                    }}
                  >👁 Profile</button>
                </div>
              </div>
            )
          })}

          {/* Add student to this room */}
          {!loading && (
            <button
              onClick={() => setSheetOpen(true)}
              style={{
                width: '100%', background: '#FEF3C7',
                border: '1.5px dashed #F59E0B', color: '#92400E',
                borderRadius: 14, padding: '16px',
                fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                boxSizing: 'border-box',
              }}
            >
              ➕ Add Student to Room {room}
            </button>
          )}
        </div>
      </div>

      <AddStudentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={() => { setSheetOpen(false); fetchStudents() }}
      />
    </div>
  )
}
