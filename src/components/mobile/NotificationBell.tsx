'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Notification } from '@/types'

// ── Time-ago formatter ────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

// ── Icon for notification type ────────────────────────────────────────────
function notifIcon(type: string): string {
  switch (type) {
    case 'student_registered': return '🎓'
    case 'payment_confirmed':  return '💰'
    default: return '🔔'
  }
}

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const { data } = await res.json()
        setNotifications(data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    intervalRef.current = setInterval(fetchNotifications, 30_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: unreadIds }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        id="notif-bell-btn"
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications() }}
        style={{
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: 8, width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 16, position: 'relative',
          color: '#fff',
        }}
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#EF4444', color: '#fff',
            borderRadius: '50%', minWidth: 16, height: 16,
            fontSize: 9, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"DM Sans", sans-serif',
            border: '1.5px solid #0F2744',
            padding: '0 3px',
            boxSizing: 'border-box',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99,
            background: 'rgba(0,0,0,0.15)',
          }}
        />
      )}

      {/* Drawer panel */}
      {open && (
        <div
          style={{
            position: 'absolute', top: 40, right: 0,
            width: 300, maxHeight: 420,
            background: '#fff', borderRadius: 16,
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            zIndex: 100,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #F1F5F9',
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: 13, fontWeight: 700, color: '#0F2744',
              fontFamily: '"DM Sans", sans-serif',
            }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: '#F59E0B', fontWeight: 700,
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ height: 56, background: '#F1F5F9', borderRadius: 10, marginBottom: 8 }} />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                padding: '32px 20px', textAlign: 'center',
                fontSize: 13, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    borderLeft: `3px solid ${n.is_read ? '#E2E8F0' : '#F59E0B'}`,
                    background: n.is_read ? '#fff' : '#FFFBEB',
                    padding: '10px 14px',
                    borderBottom: '1px solid #F8FAFC',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.3 }}>
                      {notifIcon(n.type)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, color: '#1E293B',
                        fontFamily: '"DM Sans", sans-serif',
                        lineHeight: 1.4,
                      }}>
                        {n.message}
                      </div>
                      <div style={{
                        fontSize: 10, color: '#94A3B8',
                        fontFamily: '"DM Sans", sans-serif',
                        marginTop: 3,
                      }}>
                        {timeAgo(n.created_at)}
                      </div>
                      {n.type === 'student_registered' && n.student_id && (
                        <button
                          onClick={() => {
                            setOpen(false)
                            router.push(`/dashboard/students/${n.student_id}`)
                          }}
                          style={{
                            marginTop: 6, background: '#0F2744', color: '#fff',
                            border: 'none', borderRadius: 6,
                            padding: '4px 10px', fontSize: 10, fontWeight: 700,
                            fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                          }}
                        >
                          View Student →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
