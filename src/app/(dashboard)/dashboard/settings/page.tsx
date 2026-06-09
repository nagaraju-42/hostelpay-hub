'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { TopBar } from '@/components/mobile/TopBar'
import type { HostelOwner } from '@/types'
import { Download, CreditCard, ChevronRight } from 'lucide-react'

// ── Editable field component ──────────────────────────────────────────────
function EditableField({
  label,
  value,
  onSave,
  type = 'text',
}: {
  label: string
  value: string
  onSave: (val: string) => Promise<void>
  type?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const [saving,  setSaving]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  async function handleSave() {
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
      <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif', marginBottom: 3 }}>
        {label}
      </div>
      {editing ? (
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <input
            ref={inputRef}
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            style={{
              flex: 1, border: '1.5px solid #F59E0B', borderRadius: 8,
              padding: '7px 10px', fontSize: 13, fontFamily: '"DM Sans", sans-serif',
              outline: 'none', color: '#1E293B',
            }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#2563EB', color: '#fff', border: 'none',
              borderRadius: 8, padding: '7px 12px',
              fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: '"DM Sans", sans-serif', opacity: saving ? 0.7 : 1,
            }}
          >{saving ? '…' : 'Save'}</button>
          <button
            onClick={() => { setEditing(false); setDraft(value) }}
            style={{
              background: '#F1F5F9', color: '#64748B', border: 'none',
              borderRadius: 8, padding: '7px 10px', fontSize: 12,
              cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
            }}
          >Cancel</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#1E293B', fontFamily: '"DM Sans", sans-serif', flex: 1 }}>
            {value || <span style={{ color: '#CBD5E1' }}>—</span>}
          </span>
          <button
            onClick={() => setEditing(true)}
            style={{
              background: 'none', border: '1px solid #E2E8F0', borderRadius: 7,
              padding: '3px 8px', fontSize: 11, cursor: 'pointer',
              color: '#64748B', fontFamily: '"DM Sans", sans-serif',
            }}
          >✏️ Edit</button>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const router  = useRouter()
  const [owner,     setOwner]     = useState<HostelOwner | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingQR,setDeletingQR]= useState(false)
  const [otpVisible,setOtpVisible]= useState(false)
  const [qrUrl,     setQrUrl]     = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('hostel_owners')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) setOwner(data as HostelOwner)
      setLoading(false)

      if (typeof window !== 'undefined') {
        setQrUrl(`${window.location.origin}/qr/${user.id}`)
      }
    }
    load()
  }, [router])

  // ── Update a field in Supabase ────────────────────────────────────────
  async function updateOwnerField(field: string, value: string) {
    if (!owner) return
    const supabase = createClient()
    const { error } = await supabase
      .from('hostel_owners')
      .update({ [field]: value })
      .eq('id', owner.id)
    if (error) {
      toast.error(`Failed to update ${field}`)
    } else {
      setOwner(prev => prev ? { ...prev, [field]: value } : prev)
      toast.success('Saved!')
    }
  }

  // ── Upload QR image to Supabase Storage ───────────────────────────────
  async function uploadQR(file: File) {
    if (!owner) return
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const filePath = `${user.id}/payment_qr.jpg`
    const { error: uploadError } = await supabase.storage
      .from('payment-qr')
      .upload(filePath, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('payment-qr').getPublicUrl(filePath)

    await supabase
      .from('hostel_owners')
      .update({ payment_qr_url: publicUrl })
      .eq('id', user.id)

    setOwner(prev => prev ? { ...prev, payment_qr_url: publicUrl } : prev)
    toast.success('Payment QR updated!')
    setUploading(false)
  }

  // ── Delete QR ─────────────────────────────────────────────────────────
  async function deleteQR() {
    if (!owner || !confirm('Remove payment QR image?')) return
    setDeletingQR(true)
    const supabase = createClient()
    await supabase
      .from('hostel_owners')
      .update({ payment_qr_url: null })
      .eq('id', owner.id)
    setOwner(prev => prev ? { ...prev, payment_qr_url: null } : prev)
    toast.success('QR removed.')
    setDeletingQR(false)
  }

  // ── Logout ────────────────────────────────────────────────────────────
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // ── Copy OTP ──────────────────────────────────────────────────────────
  function copyOtp() {
    if (owner?.hostel_otp) {
      navigator.clipboard.writeText(owner.hostel_otp)
      toast.success('OTP copied!')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <TopBar title="Settings" />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[80, 160, 200, 180].map((h, i) => (
          <div key={i} style={{ height: h, background: '#E2E8F0', borderRadius: 14 }} />
        ))}
      </div>
    </div>
  )

  const initials = owner?.full_name
    ? owner.full_name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar title="Settings" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 80px', WebkitOverflowScrolling: 'touch' as const }}>

        {/* ── Profile section ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', marginBottom: 10, fontFamily: '"DM Sans", sans-serif' }}>
            PROFILE
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '16px' }}>
            {/* Avatar + name header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#F59E0B', color: '#0F2744',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 400, color: '#0F2744', fontFamily: '"DM Serif Display", serif' }}>
                  {owner?.hostel_name || 'My Hostel'}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginTop: 2 }}>
                  {owner?.full_name || ''}
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <EditableField
              label="Hostel Name"
              value={owner?.hostel_name ?? ''}
              onSave={v => updateOwnerField('hostel_name', v)}
            />
            <EditableField
              label="Owner Name"
              value={owner?.full_name ?? ''}
              onSave={v => updateOwnerField('full_name', v)}
            />
            <EditableField
              label="Phone"
              value={owner?.phone ?? ''}
              onSave={v => updateOwnerField('phone', v)}
              type="tel"
            />
          </div>
        </div>

        {/* ── Payment QR Code section ──────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', marginBottom: 10, fontFamily: '"DM Sans", sans-serif' }}>
            PAYMENT QR CODE
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: '"DM Sans", sans-serif', marginBottom: 4 }}>
              Payment QR Code
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginBottom: 16 }}>
              Students will see this QR to pay rent
            </div>

            {/* QR image display */}
            {owner?.payment_qr_url ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 14 }}>
                <img
                  src={owner.payment_qr_url}
                  alt="Payment QR code"
                  style={{
                    width: 200, height: 200, objectFit: 'contain',
                    borderRadius: 12, border: '1px solid #E2E8F0',
                    marginBottom: 10,
                  }}
                />
                <button
                  onClick={deleteQR}
                  disabled={deletingQR}
                  style={{
                    background: '#FEF2F2', color: '#DC2626',
                    border: '1px solid #FECACA', borderRadius: 8,
                    padding: '6px 14px', fontSize: 11, fontWeight: 600,
                    cursor: deletingQR ? 'not-allowed' : 'pointer',
                    fontFamily: '"DM Sans", sans-serif',
                    opacity: deletingQR ? 0.7 : 1,
                  }}
                >
                  🗑 {deletingQR ? 'Removing…' : 'Remove QR'}
                </button>
              </div>
            ) : (
              <div style={{
                width: 200, height: 200, margin: '0 auto 14px',
                borderRadius: 12, border: '2px dashed #E2E8F0',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', background: '#F8FAFC',
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📲</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif', textAlign: 'center' }}>
                  No QR uploaded yet
                </div>
              </div>
            )}

            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) uploadQR(file)
                e.target.value = ''
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                width: '100%', background: uploading ? '#EFF6FF' : '#2563EB',
                color: uploading ? '#2563EB' : '#fff',
                border: 'none', borderRadius: 10, padding: '14px',
                fontSize: 14, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer',
                fontFamily: '"DM Sans", sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxSizing: 'border-box', marginBottom: 16,
              }}
            >
              {uploading ? '⏳ Uploading…' : 'Upload New QR'}
            </button>

            {/* QR note */}
            <div>
              <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif', marginBottom: 5 }}>
                Note for students (e.g. UPI ID)
              </div>
              <input
                defaultValue={owner?.payment_qr_note ?? ''}
                placeholder="e.g. UPI ID: yourname@bank"
                onBlur={e => updateOwnerField('payment_qr_note', e.target.value)}
                style={{
                  width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
                  padding: '9px 12px', fontSize: 12, fontFamily: '"DM Sans", sans-serif',
                  color: '#1E293B', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Hostel OTP section ────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', marginBottom: 10, fontFamily: '"DM Sans", sans-serif' }}>
            HOSTEL OTP &amp; JOIN QR
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '16px' }}>
            <div style={{ fontSize: 12, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginBottom: 12 }}>
              Share this OTP or QR code with students to let them register themselves
            </div>

            {/* OTP display */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {otpVisible ? (
                  (owner?.hostel_otp ?? '      ').split('').map((char, i) => (
                    <div key={i} style={{
                      width: 44, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
                      fontSize: 24, fontWeight: 700, color: '#1E293B', fontFamily: '"DM Sans", sans-serif',
                    }}>
                      {char}
                    </div>
                  ))
                ) : (
                  [...Array(6)].map((_, i) => (
                    <div key={i} style={{
                      width: 44, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
                      fontSize: 24, fontWeight: 700, color: '#CBD5E1', fontFamily: '"DM Sans", sans-serif',
                    }}>
                      •
                    </div>
                  ))
                )}
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={() => setOtpVisible(v => !v)}
                  style={{
                    background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0',
                    borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  {otpVisible ? '🙈 Hide' : '👁 Show OTP'}
                </button>
                <button
                  onClick={copyOtp}
                  style={{
                    background: '#2563EB', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  📋 Copy OTP
                </button>
              </div>
            </div>

            {/* Join QR */}
            {qrUrl && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginBottom: 10 }}>
                  Scan to register at your hostel
                </div>
                <div style={{
                  display: 'inline-block', padding: 12, background: '#fff',
                  borderRadius: 12, border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  marginBottom: 10,
                }}>
                  <QRCodeSVG
                    value={qrUrl}
                    size={160}
                    level="M"
                    fgColor="#0F2744"
                  />
                </div>
                <div style={{ marginTop: 4 }}>
                  <button
                    onClick={() => window.print()}
                    style={{
                      background: 'transparent', color: '#F59E0B',
                      border: '1px solid #F59E0B', borderRadius: 8,
                      padding: '10px 20px', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
                    }}
                  >
                    🖨️ Print / Share QR
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── App links ────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', marginBottom: 10, fontFamily: '"DM Sans", sans-serif' }}>
            APP
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 16px' }}>
            {[
              { icon: Download, label: 'Export reports',   sub: 'Download payment data', href: '/dashboard/export' },
              { icon: CreditCard, label: 'Payment history',  sub: 'View all transactions',  href: '/dashboard/history' },
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => router.push(item.href)}
                className="group"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0',
                  borderBottom: i === 0 ? '1px solid #F1F5F9' : 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', color: '#2563EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'background 0.2s',
                }} className="group-hover:bg-[#DBEAFE]">
                  <item.icon size={20} strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1, transition: 'transform 0.2s' }} className="group-hover:translate-x-1">
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans", sans-serif', color: '#1E293B', transition: 'color 0.2s' }} className="group-hover:text-[#2563EB]">{item.label}</div>
                  <div style={{ fontSize: 12, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>{item.sub}</div>
                </div>
                <ChevronRight size={20} className="text-[#CBD5E1] group-hover:text-[#2563EB] transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Logout ───────────────────────────────────────────────────── */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', background: '#FEF2F2',
            border: '1px solid #FECACA', color: '#DC2626',
            borderRadius: 14, padding: '15px',
            fontSize: 14, fontWeight: 700,
            fontFamily: '"DM Sans", sans-serif',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxSizing: 'border-box',
            minHeight: 50,
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  )
}
