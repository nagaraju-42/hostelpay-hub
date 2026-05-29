'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { StudentBottomNav } from '@/components/mobile/StudentBottomNav'
import type { Student, OwnerPublicInfo } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

function maskAadhaar(aadhaar: string | null): string {
  if (!aadhaar) return '—'
  const digits = aadhaar.replace(/\D/g, '')
  if (digits.length < 4) return '••••'
  return `XXXX XXXX ${digits.slice(-4)}`
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ width, height, radius = 8 }: { width: string | number; height: number; radius?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  )
}

// ── Field Row ──────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid #F1F5F9',
      }}
    >
      <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: '#0F2744',
            fontWeight: 500,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

interface MeResponse {
  data: Student & { owner: OwnerPublicInfo }
}

interface EditForm {
  phone: string
  address: string
  aadhaar_number: string
}

export default function StudentProfilePage() {
  const router = useRouter()
  const [meData, setMeData] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({ phone: '', address: '', aadhaar_number: '' })
  const [saving, setSaving] = useState(false)
  const [focusedField, setFocusedField] = useState<keyof EditForm | null>(null)

  // Dialogs
  const [showSwitchDialog, setShowSwitchDialog] = useState(false)
  const [switchingHostel, setSwitchingHostel] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/s'); return }
      loadData()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/student/me?t=' + Date.now(), { cache: 'no-store' })
      if (res.status === 401) { router.replace('/s'); return }
      if (res.status === 404) { router.replace('/s/join'); return }
      if (res.ok) {
        const json: MeResponse = await res.json()
        if (json.data?.approval_status === 'pending') {
          router.replace('/s/pending')
          return
        }
        setMeData(json)
        setEditForm({
          phone: json.data.phone || '',
          address: json.data.address || '',
          aadhaar_number: json.data.aadhaar_number || '',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveEdit() {
    if (!meData) return
    setSaving(true)
    try {
      const res = await fetch('/api/student/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: editForm.phone.trim(),
          address: editForm.address.trim() || null,
          aadhaar_number: editForm.aadhaar_number.trim() || null,
        }),
      })
      if (res.ok) {
        toast.success('Profile updated!')
        setEditing(false)
        await loadData()
      } else {
        const json = await res.json()
        toast.error(json.error || 'Failed to update profile')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSwitchHostel() {
    setSwitchingHostel(true)
    try {
      const res = await fetch('/api/student/me', { method: 'DELETE' })
      if (res.ok) {
        toast.success('Hostel record removed. You can now join a new hostel.')
        router.push('/s/join')
      } else {
        const json = await res.json()
        toast.error(json.error || 'Failed to switch hostel')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSwitchingHostel(false)
      setShowSwitchDialog(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.replace('/s')
    } finally {
      setSigningOut(false)
    }
  }

  const student = meData?.data

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ── Switch Hostel Confirm Dialog ── */}
      {showSwitchDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,39,68,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 100,
            padding: '0 0 env(safe-area-inset-bottom, 0)',
          }}
          onClick={() => !switchingHostel && setShowSwitchDialog(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px 32px',
              width: '100%',
              maxWidth: 430,
              animation: 'scaleIn 0.25s ease both',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 40 }}>⚠️</span>
              <h3
                style={{
                  margin: 0,
                  fontFamily: '"DM Serif Display", serif',
                  fontSize: 20,
                  color: '#0F2744',
                  textAlign: 'center',
                }}
              >
                Switch Hostel?
              </h3>
              <p
                style={{
                  margin: 0,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: '#64748B',
                  textAlign: 'center',
                  lineHeight: 1.6,
                }}
              >
                Your current hostel record and payment history will be preserved, but your link to this hostel will be removed. You&apos;ll need to join a new hostel with an OTP or QR code.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                id="confirm-switch-hostel"
                onClick={handleSwitchHostel}
                disabled={switchingHostel}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#F59E0B',
                  border: 'none',
                  borderRadius: 12,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#0F2744',
                  cursor: switchingHostel ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {switchingHostel ? (
                  <div style={{ width: 18, height: 18, border: '2px solid rgba(15,39,68,0.3)', borderTopColor: '#0F2744', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : '💬 Yes, Switch Hostel'}
              </button>
              <button
                onClick={() => setShowSwitchDialog(false)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'none',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 12,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#64748B',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TopBar ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F2744 0%, #163354 100%)',
          padding: '20px 16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <p style={{ margin: 0, fontFamily: '"DM Serif Display", serif', fontSize: 18, color: '#fff' }}>
          My Profile 👤
        </p>
        {!loading && !editing && (
          <button
            id="edit-profile-btn"
            onClick={() => setEditing(true)}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 20,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          animation: loading ? undefined : 'fadeUp 0.4s ease both',
        }}
      >
        {/* ── Avatar Card ── */}
        <div
          style={{
            background: 'linear-gradient(160deg, #0F2744 0%, #1e4776 100%)',
            padding: '28px 20px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(245,158,11,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

          {/* Avatar circle */}
          {loading ? (
            <Skeleton width={80} height={80} radius={40} />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"DM Serif Display", serif',
                fontSize: 28,
                color: '#0F2744',
                fontWeight: 700,
                border: '3px solid rgba(255,255,255,0.2)',
              }}
            >
              {student ? getInitials(student.full_name) : '?'}
            </div>
          )}

          {/* Name */}
          {loading ? (
            <Skeleton width={160} height={22} radius={8} />
          ) : (
            <p
              style={{
                margin: 0,
                fontFamily: '"DM Serif Display", serif',
                fontSize: 22,
                color: '#fff',
                textAlign: 'center',
              }}
            >
              {student?.full_name}
            </p>
          )}

          {/* Hostel chip */}
          {loading ? (
            <Skeleton width={120} height={26} radius={13} />
          ) : (
            <div
              style={{
                padding: '5px 14px',
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 20,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                color: '#F59E0B',
                fontWeight: 600,
              }}
            >
              🏨 {meData?.data?.owner?.hostel_name}
            </div>
          )}
        </div>

        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Read-only Info ── */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              padding: '4px 16px',
            }}
          >
            <InfoRow icon="🚪" label="Room Number" value={student?.room_number || '—'} />
            <InfoRow icon="💰" label="Monthly Rent" value={student ? `₹${student.rent_amount.toLocaleString('en-IN')}` : '—'} />
            <InfoRow icon="📅" label="Due Day" value={student ? `${student.monthly_due_day}${['st','nd','rd'][((student.monthly_due_day % 10) - 1)] || 'th'} of every month` : '—'} />
            <InfoRow
              icon="🗓️"
              label="Member Since"
              value={student?.date_of_joining ? format(new Date(student.date_of_joining), 'd MMM yyyy') : '—'}
            />
            <InfoRow icon="📧" label="Email" value={student?.email || '—'} />
          </div>

          {/* ── Editable Section ── */}
          <div>
            <p
              style={{
                margin: '0 0 10px',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Contact &amp; Personal
            </p>
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '4px 16px' }}>
              {editing ? (
                <>
                  {/* Phone edit */}
                  <div style={{ padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <label style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Phone
                    </label>
                    <input
                      id="edit-phone"
                      type="tel"
                      value={editForm.phone}
                      onChange={e => setEditForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 6,
                        padding: '10px 12px',
                        border: `1.5px solid ${focusedField === 'phone' ? '#0F2744' : '#E2E8F0'}`,
                        borderRadius: 8,
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 14,
                        color: '#0F2744',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Address edit */}
                  <div style={{ padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <label style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Address
                    </label>
                    <textarea
                      id="edit-address"
                      value={editForm.address}
                      onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                      onFocus={() => setFocusedField('address')}
                      onBlur={() => setFocusedField(null)}
                      rows={2}
                      placeholder="Home address or city"
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 6,
                        padding: '10px 12px',
                        border: `1.5px solid ${focusedField === 'address' ? '#0F2744' : '#E2E8F0'}`,
                        borderRadius: 8,
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 14,
                        color: '#0F2744',
                        outline: 'none',
                        resize: 'none',
                        boxSizing: 'border-box',
                        lineHeight: 1.5,
                      }}
                    />
                  </div>

                  {/* Aadhaar edit */}
                  <div style={{ padding: '12px 0' }}>
                    <label style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Aadhaar Number
                    </label>
                    <input
                      id="edit-aadhaar"
                      type="text"
                      value={editForm.aadhaar_number}
                      onChange={e => setEditForm(f => ({ ...f, aadhaar_number: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                      onFocus={() => setFocusedField('aadhaar_number')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="12-digit Aadhaar number"
                      maxLength={12}
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 6,
                        padding: '10px 12px',
                        border: `1.5px solid ${focusedField === 'aadhaar_number' ? '#0F2744' : '#E2E8F0'}`,
                        borderRadius: 8,
                        fontFamily: '"DM Serif Display", serif',
                        fontSize: 16,
                        letterSpacing: 4,
                        color: '#0F2744',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <p style={{ margin: '4px 0 0', fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#94A3B8' }}>
                      Stored securely. Only last 4 digits are shown publicly.
                    </p>
                  </div>

                  {/* Edit actions */}
                  <div style={{ paddingBottom: 12, display: 'flex', gap: 10 }}>
                    <button
                      id="save-profile-btn"
                      onClick={handleSaveEdit}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: '#0F2744',
                        border: 'none',
                        borderRadius: 10,
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#fff',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      {saving ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : '💾 Save'}
                    </button>
                    <button
                      onClick={() => { setEditing(false); if (meData) setEditForm({ phone: meData.data.phone || '', address: meData.data.address || '', aadhaar_number: meData.data.aadhaar_number || '' }) }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'none',
                        border: '1.5px solid #E2E8F0',
                        borderRadius: 10,
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#64748B',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <InfoRow icon="📞" label="Phone" value={student?.phone ? `+91 ${student.phone}` : '—'} />
                  <InfoRow icon="🏠" label="Address" value={student?.address || 'Not set'} />
                  <InfoRow icon="🪪" label="Aadhaar" value={maskAadhaar(student?.aadhaar_number || null)} />
                </>
              )}
            </div>
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <button
              id="switch-hostel-btn"
              onClick={() => setShowSwitchDialog(true)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#F59E0B',
                border: 'none',
                borderRadius: 14,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 15,
                fontWeight: 700,
                color: '#0F2744',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              💬 Switch Hostel
            </button>

            <button
              id="signout-btn"
              onClick={handleSignOut}
              disabled={signingOut}
              style={{
                width: '100%',
                padding: '14px',
                background: 'none',
                border: '1.5px solid #FCA5A5',
                borderRadius: 14,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 15,
                fontWeight: 600,
                color: '#DC2626',
                cursor: signingOut ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {signingOut ? (
                <div style={{ width: 18, height: 18, border: '2px solid #FCA5A5', borderTopColor: '#DC2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : '🚪 Sign Out'}
            </button>
          </div>

          <div style={{ height: 12 }} />
        </div>
      </div>

      {/* ── Bottom Nav ── */}
      <StudentBottomNav />
    </>
  )
}
