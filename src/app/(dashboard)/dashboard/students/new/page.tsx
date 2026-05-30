'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TopBar } from '@/components/mobile/TopBar'

interface FormData {
  full_name:       string
  email:           string
  age:             string
  room_number:     string
  phone:           string
  parent_phone:    string
  date_of_joining: string
  rent_amount:     string
  monthly_due_day: string
  aadhaar_number:  string
  address:         string
}

const EMPTY: FormData = {
  full_name: '', email: '', age: '', room_number: '',
  phone: '', parent_phone: '', date_of_joining: '',
  rent_amount: '', monthly_due_day: '5', aadhaar_number: '', address: '',
}

export default function AddStudentPage() {
  const router  = useRouter()
  const [step,  setStep]     = useState(1)
  const [form,  setForm]     = useState<FormData>(EMPTY)
  const [errors,setErrors]   = useState<Partial<FormData>>({})
  const [loading,setLoading] = useState(false)

  function update(key: keyof FormData, val: string) {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  function validateStep1() {
    const e: Partial<FormData> = {}
    if (!form.full_name.trim())  e.full_name   = 'Name is required'
    if (!form.room_number.trim()) e.room_number = 'Room number required'
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = 'Valid 10-digit phone required'
    if (!form.date_of_joining) e.date_of_joining = 'Join date required'
    if (!form.rent_amount || isNaN(Number(form.rent_amount)) || Number(form.rent_amount) <= 0) e.rent_amount = 'Valid rent required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validateStep1()) return
    setLoading(true)
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        monthly_due_day: form.monthly_due_day || '5',
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      toast.error(data.error || 'Failed to add student.')
      return
    }
    toast.success('Student added successfully!')
    router.push('/dashboard/students')
  }

  const inputStyle = (hasError: boolean) => ({
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: hasError ? '2px solid #DC2626' : '1px solid #E2E8F0',
    background: hasError ? '#FEF2F2' : '#F8FAFC',
    fontSize: 14, fontFamily: '"DM Sans", sans-serif',
    color: '#1E293B', outline: 'none', boxSizing: 'border-box' as const,
  })

  const labelStyle = {
    fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif',
    fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px', display: 'block',
  }

  const errorStyle = {
    fontSize: 11, color: '#DC2626', fontFamily: '"DM Sans", sans-serif', marginTop: 4,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar title="Add new student" backHref="/dashboard/students" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', WebkitOverflowScrolling: 'touch' as const }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: n <= step ? '#0F2744' : '#E2E8F0', transition: 'background 0.2s' }} />
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif', fontWeight: 600, marginBottom: 18, letterSpacing: '0.3px' }}>
          STEP {step} OF 3 — {step === 1 ? 'BASIC INFO' : step === 2 ? 'CONTACT DETAILS' : 'PAYMENT SETUP'}
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>FULL NAME *</label>
              <input value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Ravi Teja Reddy" style={inputStyle(!!errors.full_name)} />
              {errors.full_name && <p style={errorStyle}>{errors.full_name}</p>}
            </div>
            {/* email is optional — shown in step 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
              <div>
                <label style={labelStyle}>AGE</label>
                <input type="number" value={form.age} onChange={e => update('age', e.target.value)} placeholder="21" style={inputStyle(false)} />
              </div>
              <div>
                <label style={labelStyle}>ROOM NO. *</label>
                <input value={form.room_number} onChange={e => update('room_number', e.target.value)} placeholder="305" style={inputStyle(!!errors.room_number)} />
                {errors.room_number && <p style={errorStyle}>{errors.room_number}</p>}
              </div>
            </div>
            <div>
              <label style={labelStyle}>PHONE NUMBER *</label>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="9876543210" style={inputStyle(!!errors.phone)} />
              {errors.phone && <p style={errorStyle}>{errors.phone}</p>}
            </div>
            <div>
              <label style={labelStyle}>PARENT PHONE</label>
              <input type="tel" value={form.parent_phone} onChange={e => update('parent_phone', e.target.value)} placeholder="9123456789" style={inputStyle(false)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
              <div>
                <label style={labelStyle}>JOIN DATE *</label>
                <input type="date" value={form.date_of_joining} onChange={e => update('date_of_joining', e.target.value)} style={inputStyle(!!errors.date_of_joining)} />
                {errors.date_of_joining && <p style={errorStyle}>{errors.date_of_joining}</p>}
              </div>
              <div>
                <label style={labelStyle}>MONTHLY RENT *</label>
                <input type="number" value={form.rent_amount} onChange={e => update('rent_amount', e.target.value)} placeholder="7000" style={inputStyle(!!errors.rent_amount)} />
                {errors.rent_amount && <p style={errorStyle}>{errors.rent_amount}</p>}
              </div>
            </div>
            <div>
              <label style={labelStyle}>DUE DAY (1–28)</label>
              <input type="number" min="1" max="28" value={form.monthly_due_day} onChange={e => update('monthly_due_day', e.target.value)} style={inputStyle(false)} />
            </div>
            <div>
              <label style={labelStyle}>AADHAR NUMBER (OPTIONAL)</label>
              <input value={form.aadhaar_number} onChange={e => update('aadhaar_number', e.target.value)} placeholder="XXXX XXXX XXXX" style={inputStyle(false)} />
            </div>
            <button
              onClick={() => { if (validateStep1()) setStep(2) }}
              style={{
                background: '#0F2744', color: '#fff', border: 'none',
                padding: '15px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 6, minHeight: 50, boxSizing: 'border-box', width: '100%',
              }}
            >
              Continue to Step 2 →
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>EMAIL <span style={{ fontWeight: 400, color: '#94A3B8' }}>(OPTIONAL — needed only for student login)</span></label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="ravi.teja@gmail.com" style={inputStyle(false)} />
              <p style={{ fontSize: 11, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>Leave blank if student doesn't have or won't use the app.</p>
            </div>
            <div>
              <label style={labelStyle}>ADDRESS (OPTIONAL)</label>
              <textarea
                value={form.address}
                onChange={e => update('address', e.target.value)}
                placeholder="Home address..."
                rows={3}
                style={{ ...inputStyle(false), resize: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: '#F1F5F9', color: '#64748B', border: 'none', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', cursor: 'pointer', minHeight: 50 }}>
                ← Back
              </button>
              <button onClick={() => setStep(3)} style={{ flex: 2, background: '#0F2744', color: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', cursor: 'pointer', minHeight: 50 }}>
                Continue to Step 3 →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Review summary */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 12 }}>REVIEW DETAILS</div>
              {[
                ['Name',    form.full_name],
                ['Room',    form.room_number],
                ['Phone',   form.phone],
                form.email ? ['Email', form.email] : null,
                ['Rent',    `₹${form.rent_amount}/mo`],
                ['Due day', `${form.monthly_due_day}th of month`],
              ].filter((x): x is string[] => x !== null).map(([lbl, val]) => (
                <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: 12, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>{lbl}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', fontFamily: '"DM Sans", sans-serif' }}>{val || '—'}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, background: '#F1F5F9', color: '#64748B', border: 'none', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', cursor: 'pointer', minHeight: 50 }}>
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ flex: 2, background: loading ? '#334155' : '#0F2744', color: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', cursor: loading ? 'not-allowed' : 'pointer', minHeight: 50 }}
              >
                {loading ? 'Adding student…' : '✅ Add Student'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
