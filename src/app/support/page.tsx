'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function SupportPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    hostel_name: '',
    name: '',
    email: '',
    phone: '',
    issue_type: 'login',
    message: ''
  })
  const [activeTab, setActiveTab] = useState<'create' | 'check'>('create')
  const [ticketCode, setTicketCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleCheckTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (ticketCode.trim()) {
      router.push(`/support/${ticketCode.trim().toUpperCase()}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to submit ticket')
      }

      const { data } = await res.json()
      toast.success('Support ticket created successfully!')
      router.push(`/support/${data.ticket_code}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '40px 20px', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ background: '#0F2744', padding: '30px 20px', color: '#fff', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontFamily: '"DM Serif Display", serif', fontSize: 28 }}>Contact Support</h1>
          <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>
            We're here to help. Fill out the form below and we'll get back to you.
          </p>
        </div>

        {/* Tabs & Content - Client Only to prevent extension hydration mismatches */}
        {isMounted && (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <button
            onClick={() => setActiveTab('create')}
            style={{
              flex: 1, padding: '16px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
              color: activeTab === 'create' ? '#0F2744' : '#94A3B8',
              borderBottom: activeTab === 'create' ? '3px solid #F59E0B' : '3px solid transparent'
            }}
          >
            Create New Ticket
          </button>
          <button
            onClick={() => setActiveTab('check')}
            style={{
              flex: 1, padding: '16px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
              color: activeTab === 'check' ? '#0F2744' : '#94A3B8',
              borderBottom: activeTab === 'check' ? '3px solid #F59E0B' : '3px solid transparent'
            }}
          >
            Check Existing Ticket
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 30 }}>
          {activeTab === 'check' ? (
            <form onSubmit={handleCheckTicket} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>
                  Ticket Number
                </label>
                <input
                  required
                  type="text"
                  value={ticketCode}
                  onChange={e => setTicketCode(e.target.value)}
                  placeholder="e.g. TK-ABC123"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', fontSize: 15, color: '#0F2744', textTransform: 'uppercase' }}
                />
              </div>
              <button
                type="submit"
                style={{
                  background: '#0F2744', color: '#fff', border: 'none', padding: '16px', borderRadius: 12,
                  fontSize: 16, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Open Ticket
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>
                  Your Name
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', fontSize: 15, color: '#0F2744' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>
                  Hostel Name
                </label>
                <input
                  required
                  type="text"
                  value={form.hostel_name}
                  onChange={e => setForm({ ...form, hostel_name: e.target.value })}
                  placeholder="E.g. Sunrise Hostel"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', fontSize: 15, color: '#0F2744' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', fontSize: 15, color: '#0F2744' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>
                  Phone Number
                </label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="9876543210"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', fontSize: 15, color: '#0F2744' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>
                Issue Type
              </label>
              <select
                value={form.issue_type}
                onChange={e => setForm({ ...form, issue_type: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', fontSize: 15, color: '#0F2744', background: '#fff' }}
              >
                <option value="login">Login / Authentication Issue</option>
                <option value="payment">Payment Issue</option>
                <option value="profile">Profile Update Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>
                Message
              </label>
              <textarea
                required
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your issue in detail..."
                rows={5}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', fontSize: 15, color: '#0F2744', resize: 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: '#F59E0B', color: '#fff', border: 'none', padding: '16px', borderRadius: 12,
                fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
                marginTop: 10
              }}
            >
              {submitting ? 'Submitting...' : 'Create Support Ticket'}
            </button>
          </form>
          )}
          </div>
          </>
        )}
      </div>
    </div>
  )
}
