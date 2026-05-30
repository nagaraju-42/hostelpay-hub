'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/mobile/TopBar'
import { MobileAvatar, initialsFromName, colorFromName } from '@/components/mobile/MobileAvatar'
import { StatusBadge, statusToBadgeType, statusLabel } from '@/components/mobile/StatusBadge'
import { AddStudentSheet } from '@/components/students/AddStudentSheet'
import type { Student } from '@/types'

type Filter = 'all' | 'pending' | 'overdue' | 'due_today' | 'paid'

interface StudentWithStatus extends Student {
  payment_status?: string
}

// ── Status dot color mapping ──────────────────────────────────────────────
function statusDotColor(status?: string): string {
  switch (status) {
    case 'paid':      return '#10B981'
    case 'due_today': return '#F59E0B'
    case 'overdue':   return '#EF4444'
    default:          return '#94A3B8'
  }
}

// ── Room card component ───────────────────────────────────────────────────
function RoomCard({
  room,
  students,
  highlighted,
  onClick,
}: {
  room: string
  students: StudentWithStatus[]
  highlighted: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: `1.5px solid ${highlighted ? '#F59E0B' : '#E2E8F0'}`,
        borderRadius: 14,
        padding: '14px 12px',
        cursor: 'pointer',
        boxShadow: highlighted
          ? '0 0 0 3px rgba(245,158,11,0.12), 0 2px 8px rgba(0,0,0,0.06)'
          : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minHeight: 88,
      }}
    >
      {/* Room number */}
      <div
        style={{
          fontSize: 22,
          fontFamily: '"DM Serif Display", serif',
          color: '#0F2744',
          lineHeight: 1.1,
          fontWeight: 400,
        }}
      >
        {room}
      </div>
      {/* Student count */}
      <div
        style={{
          fontSize: 11,
          color: '#94A3B8',
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        {students.length} student{students.length !== 1 ? 's' : ''}
      </div>
      {/* Status dot row */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>
        {students.map((s) => (
          <div
            key={s.id}
            title={`${s.full_name}: ${statusLabel(s.payment_status ?? 'upcoming')}`}
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: statusDotColor(s.payment_status),
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function StudentsPage() {
  const router = useRouter()
  const [view, setView]       = useState<'grid' | 'list'>('grid')
  const [students, setStudents] = useState<StudentWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<Filter>('all')
  const [sheetOpen, setSheetOpen] = useState(false)

  async function fetchStudents() {
    setLoading(true)
    const res = await fetch('/api/students?withStatus=1')
    const { data } = await res.json()
    setStudents(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchStudents() }, [])

  // ── Derived counts ─────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:       students.filter(s => s.approval_status === 'approved').length,
    pending:   students.filter(s => s.approval_status === 'pending').length,
    overdue:   students.filter(s => s.approval_status === 'approved' && s.payment_status === 'overdue').length,
    due_today: students.filter(s => s.approval_status === 'approved' && s.payment_status === 'due_today').length,
    paid:      students.filter(s => s.approval_status === 'approved' && s.payment_status === 'paid').length,
  }), [students])

  // ── List-view filtered students ────────────────────────────────────────
  const filteredList = useMemo(() => {
    const q = search.toLowerCase()
    return students
      .filter(s => {
        if (filter === 'pending')   return s.approval_status === 'pending'
        if (s.approval_status === 'pending') return false // Hide pending from other filters
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

  // ── Grid-view: group students by room, filter rooms ────────────────────
  const roomGroups = useMemo(() => {
    const q = search.toLowerCase()
    const map = new Map<string, StudentWithStatus[]>()
    for (const s of students) {
      if (s.approval_status === 'pending') continue // Do not show pending in room grid
      if (!map.has(s.room_number)) map.set(s.room_number, [])
      map.get(s.room_number)!.push(s)
    }
    // sort room numbers
    const sorted = Array.from(map.entries()).sort(([a], [b]) => {
      const na = parseInt(a), nb = parseInt(b)
      if (!isNaN(na) && !isNaN(nb)) return na - nb
      return a.localeCompare(b)
    })
    // filter: show room if any student matches search
    return sorted.filter(([, studs]) => {
      if (!q) return true
      return studs.some(
        s =>
          s.full_name.toLowerCase().includes(q) ||
          s.room_number.toLowerCase().includes(q) ||
          s.phone.includes(q)
      )
    })
  }, [students, search])

  // ── Set of highlighted rooms (rooms that contain matching students) ────
  const highlightedRooms = useMemo(() => {
    if (!search.trim()) return new Set<string>()
    const q = search.toLowerCase()
    const set = new Set<string>()
    for (const s of students) {
      if (
        s.full_name.toLowerCase().includes(q) ||
        s.phone.includes(q)
      ) {
        set.add(s.room_number)
      }
    }
    return set
  }, [students, search])

  const FILTERS: { key: Filter; label: string; bg: string; txt: string }[] = [
    { key: 'all',      label: `All (${counts.all})`,             bg: '#0F2744', txt: '#fff'    },
    { key: 'pending',  label: `Pending (${counts.pending})`,     bg: '#F3E8FF', txt: '#6B21A8' },
    { key: 'overdue',  label: `Overdue (${counts.overdue})`,     bg: '#FEF2F2', txt: '#991B1B' },
    { key: 'due_today',label: `Due today (${counts.due_today})`, bg: '#FEF3C7', txt: '#92400E' },
    { key: 'paid',     label: `Paid (${counts.paid})`,           bg: '#ECFDF5', txt: '#065F46' },
  ]

  function getDueDateLabel(s: StudentWithStatus) {
    if (s.payment_status === 'overdue') {
      const diff = new Date().getDate() - s.monthly_due_day
      return `${diff > 0 ? diff : 1} day${diff !== 1 ? 's' : ''} late`
    }
    const d = s.monthly_due_day
    const sfx = d >= 11 && d <= 13 ? 'th' : ['th','st','nd','rd'][d % 10 < 4 ? d % 10 : 0]
    return `${d}${sfx}`
  }

  // ── TopBar right slot ──────────────────────────────────────────────────
  const topBarRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {/* Import CSV */}
      <button
        onClick={() => router.push('/dashboard/students/import')}
        title="Import from CSV"
        style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
          width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 15, color: '#fff',
        }}
      >📥</button>
      {/* Grid toggle */}
      <button
        onClick={() => setView('grid')}
        title="Grid view"
        style={{
          background: view === 'grid' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
          border: 'none', borderRadius: 8,
          width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 15, color: '#fff',
        }}
      >⊞</button>
      {/* List toggle */}
      <button
        onClick={() => setView('list')}
        title="List view"
        style={{
          background: view === 'list' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
          border: 'none', borderRadius: 8,
          width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 15, color: '#fff',
        }}
      >☰</button>
      {/* Add student */}
      <button
        onClick={() => setSheetOpen(true)}
        title="Add student"
        style={{
          background: '#F59E0B', border: 'none',
          borderRadius: 8, width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 17,
        }}
      >➕</button>
    </div>
  )



  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar
        title={view === 'grid' ? 'Rooms' : 'All students'}
        sub={loading ? '' : `${students.length} students · ${roomGroups.length} rooms`}
        backHref="/dashboard"
        right={topBarRight}
      />

      {/* Search bar — always visible */}
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
            placeholder={view === 'grid' ? 'Search rooms or students…' : 'Search name, room, phone…'}
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

      {/* Filter chips — list view only */}
      {view === 'list' && (
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
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 80px', WebkitOverflowScrolling: 'touch' }}>

        {/* ── GRID VIEW ── */}
        {view === 'grid' && (
          loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[...Array(9)].map((_, i) => (
                <div key={i} style={{ height: 88, background: '#E2E8F0', borderRadius: 14 }} />
              ))}
            </div>
          ) : roomGroups.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 14, border: '1px dashed #E2E8F0',
              padding: '32px 16px', textAlign: 'center',
              fontSize: 13, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif',
            }}>
              {search ? `No rooms match "${search}"` : 'No rooms yet. Add your first student!'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {roomGroups.map(([room, studs]) => (
                <RoomCard
                  key={room}
                  room={room}
                  students={studs}
                  highlighted={highlightedRooms.has(room)}
                  onClick={() => router.push(`/dashboard/students/room/${encodeURIComponent(room)}`)}
                />
              ))}
            </div>
          )
        )}

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          loading ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 16px' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', borderBottom: i < 4 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ width: 40, height: 40, background: '#E2E8F0', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 13, width: 130, background: '#E2E8F0', borderRadius: 6, marginBottom: 5 }} />
                    <div style={{ height: 11, width: 90, background: '#F1F5F9', borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 14, border: '1px dashed #E2E8F0',
              padding: '32px 16px', textAlign: 'center',
              fontSize: 13, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif',
            }}>
              {search ? `No students match "${search}"` : 'No students in this category'}
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 16px' }}>
              {filteredList.map((s, i) => {
                const initials   = initialsFromName(s.full_name)
                const col        = colorFromName(s.full_name)
                const status     = s.payment_status ?? 'upcoming'
                const badgeType  = statusToBadgeType(status)
                const badgeLbl   = statusLabel(status)
                const isLast     = i === filteredList.length - 1
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
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3, fontFamily: '"DM Sans", sans-serif' }}>
                        Due: {getDueDateLabel(s)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
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