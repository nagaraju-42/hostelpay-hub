'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  icon: string
  label: string
  activeIcon: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',              icon: '🏠', activeIcon: '🏠', label: 'Home'     },
  { href: '/dashboard/pending-dues', icon: '💰', activeIcon: '💰', label: 'Dues'     },
  { href: '/dashboard/students',     icon: '👥', activeIcon: '👥', label: 'Students' },
  { href: '/dashboard/history',      icon: '📊', activeIcon: '📊', label: 'History'  },
  { href: '/dashboard/settings',     icon: '⚙️', activeIcon: '⚙️', label: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="flex-shrink-0 safe-bottom"
      style={{
        background: '#fff',
        borderTop: '1px solid #E2E8F0',
        paddingTop: '8px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-[3px] flex-1 cursor-pointer transition-opacity active:opacity-70"
            >
              <span style={{ fontSize: '20px', lineHeight: 1 }}>
                {active ? item.activeIcon : item.icon}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: active ? 700 : 400,
                  color: active ? '#0F2744' : '#94A3B8',
                  letterSpacing: '0.2px',
                }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
