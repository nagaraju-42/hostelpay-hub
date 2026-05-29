'use client'

import { usePathname, useRouter } from 'next/navigation'

const TABS = [
  { href: '/s/dashboard', icon: '🏠', label: 'Home' },
  { href: '/s/payments',  icon: '💳', label: 'Payments' },
  { href: '/s/profile',   icon: '👤', label: 'Profile' },
]

export function StudentBottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav
      style={{
        position: 'sticky',
        bottom: 0,
        background: '#fff',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        padding: `8px 0 env(safe-area-inset-bottom, 8px)`,
        zIndex: 50,
        flexShrink: 0,
        boxShadow: '0 -4px 16px rgba(15,39,68,0.06)',
      }}
    >
      {TABS.map(tab => {
        const active = pathname.startsWith(tab.href)
        return (
          <button
            key={tab.href}
            id={`student-nav-${tab.label.toLowerCase()}`}
            onClick={() => router.push(tab.href)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 0 4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Active indicator top line */}
            {active && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 28,
                  height: 2,
                  borderRadius: '0 0 2px 2px',
                  background: '#F59E0B',
                }}
              />
            )}
            <span
              style={{
                fontSize: 22,
                lineHeight: 1,
                filter: active ? 'none' : 'grayscale(60%) opacity(0.6)',
                transition: 'filter 0.2s',
              }}
            >
              {tab.icon}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                fontFamily: '"DM Sans", sans-serif',
                color: active ? '#0F2744' : '#94A3B8',
                letterSpacing: '0.2px',
                transition: 'color 0.2s, font-weight 0.1s',
              }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
