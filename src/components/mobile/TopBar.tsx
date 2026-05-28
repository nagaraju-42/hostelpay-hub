// Shared mobile top-bar component — used on all owner screens
import { ReactNode } from 'react'
import Link from 'next/link'

interface TopBarProps {
  title: string
  sub?: string
  backHref?: string
  right?: ReactNode
}

export function TopBar({ title, sub, backHref, right }: TopBarProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 flex-shrink-0"
      style={{
        background: 'linear-gradient(135deg, #0F2744 0%, #163354 100%)',
        paddingTop: '14px',
        paddingBottom: '14px',
      }}
    >
      {backHref && (
        <Link
          href={backHref}
          className="flex items-center justify-center w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          style={{ fontSize: '20px', lineHeight: 1 }}
        >
          ←
        </Link>
      )}
      <div className="flex-1 min-w-0">
        {sub && (
          <p
            className="text-[10px] leading-tight"
            style={{ color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Sans", sans-serif' }}
          >
            {sub}
          </p>
        )}
        <p
          className="text-[15px] font-normal leading-tight truncate"
          style={{ color: '#fff', fontFamily: '"DM Serif Display", serif' }}
        >
          {title}
        </p>
      </div>
      {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
    </div>
  )
}
