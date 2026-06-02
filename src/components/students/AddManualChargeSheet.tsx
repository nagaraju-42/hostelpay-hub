'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

export function AddManualChargeSheet({
  studentId,
  open,
  onOpenChange,
  onAdded,
}: {
  studentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState<'charge' | 'discount'>('charge')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let finalAmount = Number(amount)
      if (type === 'discount') finalAmount = -Math.abs(finalAmount)
      else finalAmount = Math.abs(finalAmount)

      const res = await fetch(`/api/students/${studentId}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          description: desc,
          date
        })
      })
      if (!res.ok) throw new Error('Failed to add charge')
      onAdded()
      onOpenChange(false)
      setAmount('')
      setDesc('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
        <Dialog.Content style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
          padding: '24px', zIndex: 1000,
          maxHeight: '90vh', overflowY: 'auto'
        }}>
          <Dialog.Title style={{ margin: 0, fontSize: 18, fontFamily: '"DM Serif Display", serif', color: '#0F2744' }}>
            Add Custom Charge / Discount
          </Dialog.Title>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setType('charge')}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: '1px solid',
                  borderColor: type === 'charge' ? '#991B1B' : '#E2E8F0',
                  background: type === 'charge' ? '#FEF2F2' : '#fff',
                  color: type === 'charge' ? '#991B1B' : '#64748B',
                  fontWeight: 600, fontFamily: '"DM Sans", sans-serif', cursor: 'pointer'
                }}
              >
                🔴 Add Charge
              </button>
              <button
                type="button"
                onClick={() => setType('discount')}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: '1px solid',
                  borderColor: type === 'discount' ? '#065F46' : '#E2E8F0',
                  background: type === 'discount' ? '#ECFDF5' : '#fff',
                  color: type === 'discount' ? '#065F46' : '#64748B',
                  fontWeight: 600, fontFamily: '"DM Sans", sans-serif', cursor: 'pointer'
                }}
              >
                🟢 Add Discount
              </button>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 4, display: 'block' }}>
                Amount (₹)
              </label>
              <input
                type="number"
                required min="1"
                value={amount} onChange={e => setAmount(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 16 }}
                placeholder="e.g. 500"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 4, display: 'block' }}>
                Description
              </label>
              <input
                type="text"
                required
                value={desc} onChange={e => setDesc(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 16 }}
                placeholder={type === 'charge' ? "e.g. Broken chair" : "e.g. Paid early discount"}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 4, display: 'block' }}>
                Date
              </label>
              <input
                type="date"
                required
                value={date} onChange={e => setDate(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 16 }}
              />
            </div>

            {error && <div style={{ color: '#991B1B', fontSize: 13 }}>{error}</div>}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', background: '#0F2744', color: '#fff', border: 'none',
                borderRadius: 12, padding: '16px', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', opacity: loading ? 0.7 : 1, marginTop: 8
              }}
            >
              {loading ? 'Saving...' : `Save ${type === 'charge' ? 'Charge' : 'Discount'}`}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
