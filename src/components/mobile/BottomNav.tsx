'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wallet, Users, BarChart2, Settings, type LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  icon: LucideIcon
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',              icon: Home, label: 'Home'     },
  { href: '/dashboard/pending-dues', icon: Wallet, label: 'Dues'     },
  { href: '/dashboard/students',     icon: Users, label: 'Students' },
  { href: '/dashboard/history',      icon: BarChart2, label: 'History'  },
  { href: '/dashboard/settings',     icon: Settings, label: 'Settings' },
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
              <span style={{ color: active ? '#2563EB' : '#94A3B8', transition: 'color 0.2s' }}>
                <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: active ? 700 : 400,
                  color: active ? '#2563EB' : '#94A3B8',
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
