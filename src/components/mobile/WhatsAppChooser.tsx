'use client'

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface WhatsAppChooserProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentName: string
  parentPhone?: string | null
  onSelect: (action: string) => void
}

export function WhatsAppChooser({ open, onOpenChange, studentName, parentPhone, onSelect }: WhatsAppChooserProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" style={{ borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}>
        <SheetHeader style={{ marginBottom: 20 }}>
          <SheetTitle style={{ fontFamily: '"DM Serif Display", serif', fontSize: 22, color: '#0F2744' }}>
            Message {studentName.split(' ')[0]}
          </SheetTitle>
        </SheetHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => onSelect('reminder')}
            style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 14, width: '100%', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 24 }}>📋</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F2744', fontFamily: '"DM Sans", sans-serif' }}>Send Rent Reminder</div>
              <div style={{ fontSize: 12, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>Standard pending dues message</div>
            </div>
          </button>

          <button
            onClick={() => onSelect('qr')}
            style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 14, width: '100%', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 24 }}>📱</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F2744', fontFamily: '"DM Sans", sans-serif' }}>Send Payment QR</div>
              <div style={{ fontSize: 12, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>Link to your UPI payment page</div>
            </div>
          </button>

          <button
            onClick={() => onSelect('receipt')}
            style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#ECFDF5', border: '1px solid #A7F3D0', padding: 16, borderRadius: 14, width: '100%', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 24 }}>🧾</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#065F46', fontFamily: '"DM Sans", sans-serif' }}>Send Latest Receipt</div>
              <div style={{ fontSize: 12, color: '#047857', fontFamily: '"DM Sans", sans-serif' }}>Message confirming recent payment</div>
            </div>
          </button>

          <button
            onClick={() => onSelect('statement')}
            style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 14, width: '100%', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 24 }}>📊</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F2744', fontFamily: '"DM Sans", sans-serif' }}>Send Full Statement</div>
              <div style={{ fontSize: 12, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>Text summary of all pending months</div>
            </div>
          </button>

          {parentPhone && (
            <button
              onClick={() => onSelect('parent')}
              style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#FFF7ED', border: '1px solid #FFEDD5', padding: 16, borderRadius: 14, width: '100%', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 24 }}>👨👩👦</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#9A3412', fontFamily: '"DM Sans", sans-serif' }}>Message Parent</div>
                <div style={{ fontSize: 12, color: '#C2410C', fontFamily: '"DM Sans", sans-serif' }}>Remind parent about pending dues</div>
              </div>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
