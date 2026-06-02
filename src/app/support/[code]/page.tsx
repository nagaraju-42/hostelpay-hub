'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function TicketPage() {
  const { code } = useParams()
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
    fetchTicket()
  }, [code])

  async function checkAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    // If the user has a Supabase session, they are the Super Admin or Hostel Owner
    if (user) {
      setIsAdmin(true)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.support_messages])

  async function fetchTicket() {
    try {
      const res = await fetch(`/api/support/${code}`)
      if (!res.ok) throw new Error('Ticket not found')
      const { data } = await res.json()
      setTicket(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/support/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), sender: isAdmin ? 'admin' : 'student' })
      })
      if (!res.ok) throw new Error('Failed to send message')
      setMessage('')
      await fetchTicket()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: '"DM Sans", sans-serif' }}>Loading ticket details...</div>
  }

  if (error || !ticket) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: '"DM Sans", sans-serif', color: '#DC2626' }}>{error}</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '20px', fontFamily: '"DM Sans", sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 700, background: '#fff', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)' }}>
        
        {/* Header */}
        <div style={{ background: '#0F2744', padding: '20px', color: '#fff', borderRadius: '20px 20px 0 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontFamily: '"DM Serif Display", serif', fontSize: 24 }}>Ticket #{ticket.ticket_code}</h1>
            <span style={{ 
              background: ticket.status === 'open' ? '#FDE68A' : '#86EFAC', 
              color: ticket.status === 'open' ? '#92400E' : '#166534', 
              padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'uppercase'
            }}>
              {ticket.status}
            </span>
          </div>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            {ticket.name} ({ticket.hostel_name}) • {ticket.issue_type}
          </p>
        </div>

        {/* Messages List */}
        <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, background: '#F1F5F9' }}>
          
          <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', padding: '12px 16px', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>📸</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Save Your Ticket Number!</div>
              <div style={{ fontSize: 12, color: '#B45309' }}>Please take a screenshot of this page or save your ticket number (<strong>{ticket.ticket_code}</strong>) so you can check back on this chat later.</div>
            </div>
          </div>

          {ticket.support_messages.map((msg: any) => {
            // Determine if the *current viewer* is the one who sent this message
            const isMyMessage = isAdmin ? msg.sender === 'admin' : msg.sender === 'student'
            const senderLabel = isMyMessage ? 'You' : (isAdmin ? 'Student' : 'Support Team')

            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMyMessage ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, fontWeight: 600 }}>
                  {senderLabel} • {new Date(msg.created_at).toLocaleString()}
                </span>
                <div style={{
                  background: isMyMessage ? '#F59E0B' : '#fff',
                  color: isMyMessage ? '#fff' : '#0F2744',
                  padding: '12px 16px',
                  borderRadius: isMyMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  maxWidth: '85%',
                  lineHeight: 1.5,
                  fontSize: 15
                }}>
                  {msg.message}
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your reply..."
              style={{ flex: 1, padding: '14px 16px', borderRadius: 24, border: '1px solid #E2E8F0', outline: 'none', fontSize: 15 }}
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              style={{
                background: '#0F2744', color: '#fff', border: 'none', padding: '0 24px', borderRadius: 24,
                fontWeight: 700, cursor: (sending || !message.trim()) ? 'not-allowed' : 'pointer', opacity: (sending || !message.trim()) ? 0.7 : 1
              }}
            >
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
