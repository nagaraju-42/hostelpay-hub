'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Users, IndianRupee, Building2, ExternalLink, TrendingUp, AlertTriangle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddOwnerDialog } from '@/components/admin/AddOwnerDialog'
import type { OwnerWithStats } from '@/app/api/admin/owners/route'

const BADGE_COLORS: Record<string, [string, string]> = {
  green:  ['#ECFDF5', '#065F46'],
  amber:  ['#FEF3C7', '#92400E'],
  red:    ['#FEF2F2', '#991B1B'],
  blue:   ['#E6F1FB', '#185FA5'],
  purple: ['#EDE9FE', '#5B21B6'],
}

function StatusPill({ label, type = 'green' }: { label: string; type?: string }) {
  const [bg, txt] = BADGE_COLORS[type] ?? BADGE_COLORS.green
  return (
    <span style={{
      background: bg, color: txt,
      fontSize: 10, fontWeight: 700, padding: '3px 8px',
      borderRadius: 6, fontFamily: '"DM Sans", sans-serif',
    }}>{label}</span>
  )
}

export default function AdminDashboardPage() {
  const [owners,     setOwners]     = useState<OwnerWithStats[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetch('/api/admin/owners')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setOwners(d.data || [])
      })
      .catch(() => setError('Network error while fetching owners.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleImpersonate(ownerId: string) {
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: ownerId })
      })
      if (res.ok) {
        window.location.href = '/dashboard'
      } else {
        alert('Failed to start impersonation')
      }
    } catch (e) {
      alert('Network error')
    }
  }

  async function handleCopyLink(ownerId: string) {
    try {
      const res = await fetch(`/api/admin/owners/${ownerId}/magic-link`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.magicLink) {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(data.magicLink)
          alert('Magic login link copied to clipboard! (Expires in 10 minutes)')
        } else {
          // Fallback for non-HTTPS local testing
          const textArea = document.createElement("textarea")
          textArea.value = data.magicLink
          document.body.appendChild(textArea)
          textArea.select()
          try {
            document.execCommand('copy')
            alert('Magic login link copied to clipboard! (Expires in 10 minutes)')
          } catch (err) {
            alert(`Failed to copy automatically. Here is the link:\n\n${data.magicLink}`)
          }
          document.body.removeChild(textArea)
        }
      } else {
        alert(`Failed to generate link: ${data.error || 'Unknown error'}`)
      }
    } catch (e) {
      alert('Network error while generating magic link')
    }
  }

  async function handleWhatsAppShare(ownerId: string, phone: string) {
    try {
      const res = await fetch(`/api/admin/owners/${ownerId}/magic-link`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.magicLink) {
        const waText = encodeURIComponent(`Here is your secure 10-minute login link for HostelPay Hub:\n${data.magicLink}`)
        const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${waText}`
        window.open(waUrl, '_blank')
      } else {
        alert(`Failed to generate link: ${data.error || 'Unknown error'}`)
      }
    } catch (e) {
      alert('Network error while generating magic link')
    }
  }

  const totalStudents = owners.reduce((s, o) => s + (o.student_count || 0), 0)
  const totalRevenue  = owners.reduce((s, o) => s + (o.monthly_revenue || 0), 0)

  const fmtRevenue = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000  ? `₹${(n / 1000).toFixed(1)}K`
    : `₹${n}`

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #F59E0B', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: '"DM Sans", sans-serif' }}>
            Loading platform data…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error) return (
    <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 12, padding: 20, color: '#FCA5A5' }}>
      <p>{error}</p>
      <p style={{ fontSize: 12, marginTop: 8, color: 'rgba(252,165,165,0.7)' }}>Ensure you are logged in with the SUPER_ADMIN_EMAIL.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 400, color: '#fff', fontFamily: '"DM Serif Display", serif', margin: 0 }}>
            Platform Overview
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>
            Manage all registered hostel owners &amp; monitor platform health
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/admin/support"
            style={{
              background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
              padding: '10px 18px', borderRadius: 10, textDecoration: 'none',
              fontSize: 13, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
              display: 'flex', alignItems: 'center', gap: 8,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            <MessageSquare size={15} /> Support Tickets
          </Link>
          <button
            onClick={() => setDialogOpen(true)}
            style={{
              background: '#F59E0B', color: '#111', border: 'none',
              padding: '10px 18px', borderRadius: 10,
              fontSize: 13, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            <Plus size={15} /> Add New Owner
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { icon: <Building2 size={18} />, val: String(owners.length),    lbl: 'Active hostels',   col: '#60A5FA' },
          { icon: <Users size={18} />,     val: String(totalStudents),     lbl: 'Total students',   col: '#A78BFA' },
          { icon: <IndianRupee size={18}/>, val: fmtRevenue(totalRevenue), lbl: 'MTD revenue',      col: '#34D399' },
          { icon: <AlertTriangle size={18}/>,val: '—',                     lbl: 'Overdue entries',  col: '#F87171' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '16px 18px',
          }}>
            <div style={{ color: s.col, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.col, fontFamily: '"DM Serif Display", serif' }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Owners Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', margin: 0 }}>
            REGISTERED HOSTELS
          </h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: '"DM Sans", sans-serif' }}>
            {owners.length} total
          </span>
        </div>

        {owners.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '48px 24px', textAlign: 'center',
          }}>
            <Building2 size={40} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' }} />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontFamily: '"DM Sans", sans-serif' }}>No hostel owners yet</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {owners.map(owner => {
              const revenue  = owner.monthly_revenue || 0
              const students = owner.student_count   || 0
              // derive initials from hostel_name
              const initials = owner.hostel_name
                ? owner.hostel_name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                : 'H'
              const COLORS = ['#E6F1FB','#EDE9FE','#FEF3C7','#ECFDF5','#FAECE7']
              const TXTS   = ['#185FA5','#5B21B6','#92400E','#065F46','#993C1D']
              const ci     = owner.hostel_name ? owner.hostel_name.charCodeAt(0) % 5 : 0

              return (
                <div
                  key={owner.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, padding: '18px 20px',
                    display: 'flex', alignItems: 'center', gap: 16,
                    transition: 'border-color 0.15s',
                  }}
                >
                  {/* Initials */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: COLORS[ci], color: TXTS[ci],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', fontFamily: '"DM Sans", sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={14} style={{ color: '#A78BFA', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{owner.hostel_name}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: '"DM Sans", sans-serif', marginTop: 2 }}>
                      {owner.full_name} · {owner.phone}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: '"DM Sans", monospace', marginTop: 1 }}>
                      {owner.email}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 20,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10, padding: '10px 16px', flexShrink: 0,
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: '"DM Sans", sans-serif', marginBottom: 2 }}>
                        <Users size={11} /> Students
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: '"DM Serif Display", serif' }}>{students}</div>
                    </div>
                    <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.06)' }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: '"DM Sans", sans-serif', marginBottom: 2 }}>
                        <IndianRupee size={11} /> Revenue
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#34D399', fontFamily: '"DM Serif Display", serif' }}>
                        {fmtRevenue(revenue)}
                      </div>
                    </div>
                  </div>

                  {/* Status + Link */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <StatusPill label="Active" type="green" />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button 
                        onClick={() => handleImpersonate(owner.id)}
                        style={{
                          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: 12, color: '#F59E0B', fontWeight: 600,
                          fontFamily: '"DM Sans", sans-serif',
                        }}>
                        🕵️ Impersonate
                      </button>
                      <button 
                        onClick={() => handleCopyLink(owner.id)}
                        style={{
                          background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: 12, color: '#34D399', fontWeight: 600,
                          fontFamily: '"DM Sans", sans-serif',
                        }}>
                        🔗 Copy Link
                      </button>
                      <button 
                        onClick={() => handleWhatsAppShare(owner.id, owner.phone)}
                        style={{
                          background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)',
                          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: 12, color: '#25D366', fontWeight: 600,
                          fontFamily: '"DM Sans", sans-serif',
                        }}>
                        💬 WhatsApp
                      </button>
                      <Link href={`/admin/owners/${owner.id}`}>
                        <button style={{
                          background: 'rgba(255,255,255,0.07)', border: 'none',
                          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: 12, color: 'rgba(255,255,255,0.5)',
                          fontFamily: '"DM Sans", sans-serif',
                          transition: 'background 0.15s, color 0.15s',
                        }}>
                          <ExternalLink size={12} /> View
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AddOwnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={(newOwner) => {
          const formatted = { ...newOwner, monthly_revenue: newOwner.monthly_revenue || 0, student_count: newOwner.student_count || 0 }
          setOwners([formatted, ...owners])
          setDialogOpen(false)
        }}
      />
    </div>
  )
}