'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  amount: number | string
  onComplete: () => void
}

export function PaymentCelebration({ amount, onComplete }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      onComplete()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  if (!mounted) return null

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(255,255,255,0.95)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        width: 100, height: 100, background: '#10B981', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)',
        animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        marginBottom: 24
      }}>
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      
      <div style={{
        fontSize: 32, fontWeight: 800, color: '#0F2744', fontFamily: '"DM Serif Display", serif',
        animation: 'slideUp 0.5s ease-out 0.2s both'
      }}>
        ₹{Number(amount).toLocaleString('en-IN')} Collected!
      </div>
      
      <div style={{
        fontSize: 16, color: '#10B981', fontWeight: 600, fontFamily: '"DM Sans", sans-serif', marginTop: 8,
        animation: 'slideUp 0.5s ease-out 0.3s both'
      }}>
        Payment recorded successfully
      </div>

      <div className="confetti-container" />
    </div>,
    document.body
  )
}
