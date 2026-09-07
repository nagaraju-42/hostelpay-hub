'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  hostelName: string
  ownerName: string
}

export function HamburgerDrawer({ open, onOpenChange, hostelName, ownerName }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const navigate = (path: string) => {
    onOpenChange(false)
    router.push(path)
  }

  const MENU_ITEMS = [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '👥', label: 'Students', path: '/dashboard/students' },
    { icon: '🏢', label: 'Room Map', path: '/dashboard/rooms' },
    { icon: '📋', label: 'Payment History', path: '/dashboard/history' },
    { icon: '📊', label: 'Export Reports', path: '/dashboard/export' },
    { icon: '⚙️', label: 'Settings', path: '/dashboard/settings' },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" style={{ width: '80%', padding: 0, display: 'flex', flexDirection: 'column' }}>
        <SheetTitle style={{ display: 'none' }}>Menu</SheetTitle>
        
        {/* Header */}
        <div style={{ background: '#0F2744', padding: '40px 20px 20px', color: '#fff' }}>
          <div style={{ width: 60, height: 60, background: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
            {ownerName.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: 20, fontFamily: '"DM Serif Display", serif' }}>{hostelName}</div>
          <div style={{ fontSize: 14, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>{ownerName}</div>
        </div>

        {/* Menu Items */}
        <div style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {MENU_ITEMS.map(item => {
            const isActive = pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, width: '100%',
                  padding: '14px 16px', background: isActive ? '#EFF6FF' : 'transparent',
                  border: 'none', borderRadius: 12, cursor: 'pointer',
                  color: isActive ? '#1D4ED8' : '#334155',
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontSize: 16, fontWeight: isActive ? 700 : 500, fontFamily: '"DM Sans", sans-serif' }}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: 20, borderTop: '1px solid #E2E8F0' }}>
          <button
            onClick={() => navigate('/login')} // simple logout for now
            style={{
              display: 'flex', alignItems: 'center', gap: 16, width: '100%',
              padding: '14px 16px', background: '#FEF2F2',
              border: 'none', borderRadius: 12, cursor: 'pointer',
              color: '#DC2626',
            }}
          >
            <span style={{ fontSize: 20 }}>🚪</span>
            <span style={{ fontSize: 16, fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>Sign Out</span>
          </button>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 16, fontFamily: '"DM Sans", sans-serif' }}>
            HostelPay Hub v2.0
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
