import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'

export default async function AdminSupportPage() {
  const { data: tickets } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })

  const ticketList = tickets || []

  return (
    <div style={{ padding: '40px', background: '#0F172A', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <Link href="/admin" style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 400, color: '#fff', fontFamily: '"DM Serif Display", serif', margin: 0, marginLeft: 'auto' }}>
          Support Tickets
        </h1>
      </div>

      {/* Tickets List */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Ticket Code</th>
              <th style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Hostel</th>
              <th style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Student</th>
              <th style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Issue Type</th>
              <th style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {ticketList.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No support tickets found.</td></tr>
            ) : (
              ticketList.map(ticket => (
                <tr key={ticket.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '16px 20px', color: '#fff', fontWeight: 600 }}>{ticket.ticket_code}</td>
                  <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.7)' }}>{ticket.hostel_name}</td>
                  <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.7)' }}>
                    {ticket.name}<br/>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{ticket.phone}</span>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.7)' }}>{ticket.issue_type}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      background: ticket.status === 'open' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)', 
                      color: ticket.status === 'open' ? '#FDE68A' : '#A7F3D0',
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' 
                    }}>
                      {ticket.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <Link href={`/support/${ticket.ticket_code}`} target="_blank" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'rgba(255,255,255,0.05)', color: '#fff', textDecoration: 'none',
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600
                    }}>
                      <MessageSquare size={14} /> Reply
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
