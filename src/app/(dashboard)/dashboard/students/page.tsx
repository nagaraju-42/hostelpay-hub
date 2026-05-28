'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/mobile/TopBar'
import { MobileAvatar, initialsFromName, colorFromName } from '@/components/mobile/MobileAvatar'
import { StatusBadge, statusToBadgeType, statusLabel } from '@/components/mobile/StatusBadge'
import { AddStudentSheet } from '@/components/students/AddStudentSheet'
import type { Student } from '@/types'

type Filter = 'all' | 'overdue' | 'due_today' | 'paid'

interface StudentWithStatus extends Student {
  payment_status?: string
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents]   = useState<StudentWithStatus[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState<Filter>('all')
  const [sheetOpen, setSheetOpen] = useState(false)

  async function fetchStudents() {
    setLoading(true)
    const res = await fetch('/api/students?withStatus=1')
    const { data } = await res.json()
    setStudents(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchStudents() }, [])

  const counts = useMemo(() => ({
    all:      students.length,
    overdue:  students.filter(s => s.payment_status === 'overdue').length,
    due_today: students.filter(s => s.payment_status === 'due_today').length,
    paid:     students.filter(s => s.payment_status === 'paid').length,
  }), [students])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return students
      .filter(s => {
        if (filter === 'overdue')   return s.payment_status === 'overdue'
        if (filter === 'due_today') return s.payment_status === 'due_today'
        if (filter === 'paid')      return s.payment_status === 'paid'
        return true
      })
      .filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.room_number.toLowerCase().includes(q) ||
        s.phone.includes(q)
      )
  }, [students, filter, search])

  const FILTERS: { key: Filter; label: string; bg: string; txt: string }[] = [
    { key: 'all',      label: `All (${counts.all})`,          bg: '#0F2744',  txt: '#fff'    },
    { key: 'overdue',  label: `Overdue (${counts.overdue})`,  bg: '#FEF2F2',  txt: '#991B1B' },
    { key: 'due_today',label: `Due today (${counts.due_today})`, bg: '#FEF3C7', txt: '#92400E' },
    { key: 'paid',     label: `Paid (${counts.paid})`,        bg: '#ECFDF5',  txt: '#065F46' },
  ]

  function getDueDateLabel(s: StudentWithStatus) {
    if (s.payment_status === 'overdue') return `${new Date().getDate() - s.monthly_due_day} days late`
    const d = s.monthly_due_day
    const sfx = d >= 11 && d <= 13 ? 'th' : ['th','st','nd','rd'][d % 10 < 4 ? d % 10 : 0]
    return `${d}${sfx}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar
        title="All students"
        sub={loading ? '' : `${students.length} students`}
        backHref="/dashboard"
        right={
          <button
            onClick={() => setSheetOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: 8, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 18, color: '#fff',
            }}
          >➕</button>
        }
      />

      {/* Search */}
      <div style={{ padding: '10px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '10px 13px', borderRadius: 12,
          border: '1px solid #E2E8F0', background: '#fff',
        }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, room, phone…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, fontFamily: '"DM Sans", sans-serif', color: '#1E293B',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 14 }}>✕</button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{
        padding: '9px 16px', display: 'flex', gap: 7,
        overflowX: 'auto', flexShrink: 0,
        scrollbarWidth: 'none',
      }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '5px 13px', borderRadius: 20, border: 'none',
              background: filter === f.key ? f.bg : (f.key === 'all' ? '#F1F5F9' : f.bg),
              color: filter === f.key ? f.txt : (f.key === 'all' ? '#64748B' : f.txt),
              opacity: filter === f.key ? 1 : 0.65,
              fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
              fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* Student List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 16px' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', borderBottom: i < 4 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ width: 40, height: 40, background: '#E2E8F0', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 13, width: 130, background: '#E2E8F0', borderRadius: 6, marginBottom: 5 }} />
                  <div style={{ height: 11, width: 90,  background: '#F1F5F9', borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: 14, border: '1px dashed #E2E8F0',
            padding: '32px 16px', textAlign: 'center',
            fontSize: 13, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif',
          }}>
            {search ? `No students match "${search}"` : 'No students in this category'}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 16px' }}>
            {filtered.map((s, i) => {
              const initials = initialsFromName(s.full_name)
              const col      = colorFromName(s.full_name)
              const status   = s.payment_status ?? 'upcoming'
              const badgeType = statusToBadgeType(status)
              const badgeLbl  = statusLabel(status)
              const isLast    = i === filtered.length - 1
              return (
                <div
                  key={s.id}
                  onClick={() => router.push(`/dashboard/students/${s.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '13px 0',
                    borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <MobileAvatar initials={initials} color={col} size={42} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', color: '#1E293B' }}>{s.full_name}</div>
                      <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>Room {s.room_number} · {s.phone}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <StatusBadge label={badgeLbl} type={badgeType} />
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3, fontFamily: '"DM Sans", sans-serif' }}>Due: {getDueDateLabel(s)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AddStudentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={() => { setSheetOpen(false); fetchStudents() }}
      />
    </div>
  )
}