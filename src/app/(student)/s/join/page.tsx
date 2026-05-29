'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { StudentJoinFormData } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────
function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '13px 14px',
    border: `1.5px solid ${focused ? '#0F2744' : '#E2E8F0'}`,
    borderRadius: 10,
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 14,
    color: '#0F2744',
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      style={{
        display: 'block',
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 12,
        fontWeight: 600,
        color: '#64748B',
        marginBottom: 6,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
      }}
    >
      {children}
      {required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
    </label>
  )
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
}

interface FocusState {
  otp: boolean; name: boolean; phone: boolean; room: boolean
  rent: boolean; dueDay: boolean; address: boolean
}

export default function StudentJoinPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ownerParam = searchParams.get('owner')

  const [hostelName, setHostelName] = useState<string | null>(null)
  const [hostelLoading, setHostelLoading] = useState(!!ownerParam)
  const [hostelError, setHostelError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [focused, setFocused] = useState<FocusState>({
    otp: false, name: false, phone: false, room: false,
    rent: false, dueDay: false, address: false,
  })

  const [form, setForm] = useState<StudentJoinFormData>({
    hostel_otp: '',
    owner_id: ownerParam || undefined,
    full_name: '',
    phone: '',
    room_number: '',
    rent_amount: '',
    monthly_due_day: '5',
    address: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof StudentJoinFormData, string>>>({})

  // Verify auth on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/s')
      }
    })
  }, [router])

  // Fetch hostel info if coming via QR
  const fetchHostel = useCallback(async (id: string) => {
    setHostelLoading(true)
    setHostelError(false)
    try {
      const res = await fetch(`/api/student/hostel?owner_id=${encodeURIComponent(id)}`)
      if (res.ok) {
        const data = await res.json()
        setHostelName(data.hostel_name)
      } else {
        setHostelError(true)
      }
    } catch {
      setHostelError(true)
    } finally {
      setHostelLoading(false)
    }
  }, [])

  useEffect(() => {
    if (ownerParam) {
      fetchHostel(ownerParam)
    }
  }, [ownerParam, fetchHostel])

  function set(field: keyof StudentJoinFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const e: typeof errors = {}
    if (!ownerParam && form.hostel_otp.trim().length !== 6) {
      e.hostel_otp = 'Enter a 6-character hostel OTP'
    }
    if (!form.full_name.trim()) e.full_name = 'Full name is required'
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit phone number'
    if (!form.room_number.trim()) e.room_number = 'Room number is required'
    if (form.monthly_due_day) {
      const d = Number(form.monthly_due_day)
      if (isNaN(d) || d < 1 || d > 28) e.monthly_due_day = 'Enter a day between 1 and 28'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const payload = {
        ...(ownerParam ? { owner_id: ownerParam } : { hostel_otp: form.hostel_otp.trim().toUpperCase() }),
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        room_number: form.room_number.trim(),
        rent_amount: form.rent_amount ? Number(form.rent_amount) : undefined,
        monthly_due_day: form.monthly_due_day ? Number(form.monthly_due_day) : 5,
        address: form.address?.trim() || undefined,
      }

      const res = await fetch('/api/student/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (res.ok) {
        toast.success(`Welcome to ${hostelName || 'your hostel'}! 🎉`)
        router.push('/s/dashboard')
      } else {
        toast.error(json.error || 'Failed to join hostel')
        if (json.field) {
          setErrors(prev => ({ ...prev, [json.field]: json.error }))
        }
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* TopBar */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F2744 0%, #163354 100%)',
          padding: '20px 16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontFamily: '"DM Serif Display", serif',
              fontSize: 17,
              color: '#fff',
            }}
          >
            Join Your Hostel
          </p>
          <p
            style={{
              margin: '3px 0 0',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            One-time setup · takes 1 minute
          </p>
        </div>
        <span style={{ fontSize: 28 }}>🏠</span>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 20px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          animation: 'fadeUp 0.4s ease both',
        }}
      >
        {/* Hostel card (QR flow) */}
        {ownerParam && (
          <div
            style={{
              background: hostelError ? '#FEF2F2' : '#F0FDF4',
              border: `1.5px solid ${hostelError ? '#FCA5A5' : '#86EFAC'}`,
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            {hostelLoading ? (
              <>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    border: '2px solid #86EFAC',
                    borderTopColor: '#16A34A',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 14, color: '#15803D' }}>
                  Loading hostel info…
                </span>
              </>
            ) : hostelError ? (
              <>
                <span style={{ fontSize: 22 }}>❌</span>
                <div>
                  <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
                    Hostel not found
                  </p>
                  <p style={{ margin: '2px 0 0', fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#EF4444' }}>
                    The QR code may be invalid. Ask your hostel owner.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(22,163,74,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  🏨
                </div>
                <div>
                  <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#16A34A', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Joining
                  </p>
                  <p style={{ margin: '2px 0 0', fontFamily: '"DM Serif Display", serif', fontSize: 17, color: '#0F2744' }}>
                    {hostelName}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* OTP field — only when no ?owner */}
          {!ownerParam && (
            <FieldGroup>
              <Label required>Hostel OTP</Label>
              <input
                id="hostel-otp-input"
                type="text"
                value={form.hostel_otp}
                onChange={e => set('hostel_otp', e.target.value.toUpperCase().slice(0, 6))}
                onFocus={() => setFocused(f => ({ ...f, otp: true }))}
                onBlur={() => setFocused(f => ({ ...f, otp: false }))}
                placeholder="A1B2C3"
                maxLength={6}
                autoComplete="off"
                style={{
                  ...inputStyle(focused.otp),
                  fontSize: 32,
                  textAlign: 'center',
                  letterSpacing: 8,
                  fontFamily: '"DM Serif Display", serif',
                  fontWeight: 700,
                  color: '#0F2744',
                  border: `2px solid ${focused.otp ? '#0F2744' : errors.hostel_otp ? '#EF4444' : '#E2E8F0'}`,
                  padding: '16px 14px',
                }}
              />
              {errors.hostel_otp && (
                <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#EF4444' }}>
                  {errors.hostel_otp}
                </p>
              )}
              <p style={{ margin: '4px 0 0', fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#94A3B8' }}>
                Ask your hostel owner for the 6-character code
              </p>
            </FieldGroup>
          )}

          {/* Section header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 4,
            }}
          >
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.5px', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
              Your Details
            </span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          {/* Full Name */}
          <FieldGroup>
            <Label required>Full Name</Label>
            <input
              id="student-full-name"
              type="text"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              onFocus={() => setFocused(f => ({ ...f, name: true }))}
              onBlur={() => setFocused(f => ({ ...f, name: false }))}
              placeholder="e.g. Priya Sharma"
              style={{
                ...inputStyle(focused.name),
                border: `1.5px solid ${focused.name ? '#0F2744' : errors.full_name ? '#EF4444' : '#E2E8F0'}`,
              }}
            />
            {errors.full_name && (
              <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#EF4444' }}>
                {errors.full_name}
              </p>
            )}
          </FieldGroup>

          {/* Phone */}
          <FieldGroup>
            <Label required>Phone Number</Label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  color: '#64748B',
                  pointerEvents: 'none',
                }}
              >
                +91
              </span>
              <input
                id="student-phone"
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                onFocus={() => setFocused(f => ({ ...f, phone: true }))}
                onBlur={() => setFocused(f => ({ ...f, phone: false }))}
                placeholder="9876543210"
                maxLength={10}
                style={{
                  ...inputStyle(focused.phone),
                  paddingLeft: 46,
                  border: `1.5px solid ${focused.phone ? '#0F2744' : errors.phone ? '#EF4444' : '#E2E8F0'}`,
                }}
              />
            </div>
            {errors.phone && (
              <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#EF4444' }}>
                {errors.phone}
              </p>
            )}
          </FieldGroup>

          {/* Room Number */}
          <FieldGroup>
            <Label required>Room Number</Label>
            <input
              id="student-room"
              type="text"
              value={form.room_number}
              onChange={e => set('room_number', e.target.value)}
              onFocus={() => setFocused(f => ({ ...f, room: true }))}
              onBlur={() => setFocused(f => ({ ...f, room: false }))}
              placeholder="e.g. 101, A-12, Ground Floor"
              style={{
                ...inputStyle(focused.room),
                border: `1.5px solid ${focused.room ? '#0F2744' : errors.room_number ? '#EF4444' : '#E2E8F0'}`,
              }}
            />
            {errors.room_number && (
              <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#EF4444' }}>
                {errors.room_number}
              </p>
            )}
          </FieldGroup>

          {/* Optional section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.5px', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
              Optional
            </span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          {/* Rent & Due Day row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FieldGroup>
              <Label>Monthly Rent (₹)</Label>
              <input
                id="student-rent"
                type="number"
                value={form.rent_amount}
                onChange={e => set('rent_amount', e.target.value)}
                onFocus={() => setFocused(f => ({ ...f, rent: true }))}
                onBlur={() => setFocused(f => ({ ...f, rent: false }))}
                placeholder="5000"
                min={0}
                style={inputStyle(focused.rent)}
              />
            </FieldGroup>
            <FieldGroup>
              <Label>Due Day</Label>
              <input
                id="student-due-day"
                type="number"
                value={form.monthly_due_day}
                onChange={e => set('monthly_due_day', e.target.value)}
                onFocus={() => setFocused(f => ({ ...f, dueDay: true }))}
                onBlur={() => setFocused(f => ({ ...f, dueDay: false }))}
                placeholder="5"
                min={1}
                max={28}
                style={{
                  ...inputStyle(focused.dueDay),
                  border: `1.5px solid ${focused.dueDay ? '#0F2744' : errors.monthly_due_day ? '#EF4444' : '#E2E8F0'}`,
                }}
              />
              {errors.monthly_due_day && (
                <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#EF4444' }}>
                  {errors.monthly_due_day}
                </p>
              )}
            </FieldGroup>
          </div>

          {/* Address */}
          <FieldGroup>
            <Label>Address / Home Town</Label>
            <textarea
              id="student-address"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              onFocus={() => setFocused(f => ({ ...f, address: true }))}
              onBlur={() => setFocused(f => ({ ...f, address: false }))}
              placeholder="Home address or city"
              rows={2}
              style={{
                ...inputStyle(focused.address),
                resize: 'none',
                lineHeight: 1.5,
              }}
            />
          </FieldGroup>

          {/* Submit */}
          <button
            id="student-join-submit"
            type="submit"
            disabled={submitting || (!!ownerParam && hostelLoading) || (!!ownerParam && hostelError)}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '16px',
              background: submitting ? '#64748B' : '#0F2744',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 16,
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.2s',
              letterSpacing: '0.2px',
            }}
          >
            {submitting ? (
              <>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Joining…
              </>
            ) : (
              '🏠 Join Hostel'
            )}
          </button>
        </form>
      </div>
    </>
  )
}
