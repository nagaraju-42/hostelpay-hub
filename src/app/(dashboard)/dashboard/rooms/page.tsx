'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/mobile/TopBar'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'

export default function RoomsPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<any[]>([])
  
  async function fetchRooms() {
    const res = await fetch('/api/students?withStatus=1')
    if (!res.ok) return
    const { data } = await res.json()
    
    // Group by room
    const roomMap: Record<string, any> = {}
    data.forEach((s: any) => {
      if (!roomMap[s.room_number]) {
        roomMap[s.room_number] = { number: s.room_number, students: [], totalDue: 0, hasOverdue: false, hasDueToday: false }
      }
      roomMap[s.room_number].students.push(s)
      if (s.status === 'overdue') roomMap[s.room_number].hasOverdue = true
      if (s.status === 'due_today') roomMap[s.room_number].hasDueToday = true
      if (s.total_owed) roomMap[s.room_number].totalDue += s.total_owed
    })
    
    setRooms(Object.values(roomMap).sort((a, b) => a.number.localeCompare(b.number, undefined, {numeric: true})))
  }

  useEffect(() => { fetchRooms() }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: '#F8FAFC' }}>
      <TopBar title="Floor Map" right={<div style={{ fontSize: 18 }}>≡</div>} />
      
      <div className="mobile-scroll" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {rooms.map(room => {
            const bg = room.hasOverdue ? '#FEF2F2' : room.hasDueToday ? '#FFFBEB' : '#ECFDF5'
            const border = room.hasOverdue ? '#FECACA' : room.hasDueToday ? '#FDE68A' : '#A7F3D0'
            const text = room.hasOverdue ? '#991B1B' : room.hasDueToday ? '#92400E' : '#065F46'
            
            return (
              <div 
                key={room.number}
                onClick={() => router.push(`/dashboard/students/room/${room.number}`)}
                style={{
                  background: bg, border: `1px solid ${border}`, borderRadius: 16,
                  padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: text, fontFamily: '"DM Serif Display", serif' }}>
                    {room.number}
                  </div>
                  <div style={{ fontSize: 12, background: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: 10, color: text }}>
                    {room.students.length} {room.students.length === 1 ? 'boy' : 'boys'}
                  </div>
                </div>
                
                {room.totalDue > 0 ? (
                  <div style={{ fontSize: 14, fontWeight: 700, color: text }}>
                    ₹{room.totalDue.toLocaleString('en-IN')} due
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: text }}>All paid up ✅</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
