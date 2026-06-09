// Shared mobile top-bar component — used on all owner screens
import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        paddingTop: '16px',
        paddingBottom: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {backHref && (
        <Link
          href={backHref}
          className="flex items-center justify-center w-10 h-10 rounded-full text-[#1E293B] hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </Link>
      )}
      <div className="flex-1 min-w-0">
        <p
          className="text-[16px] font-semibold leading-tight truncate"
          style={{ color: '#1E293B', fontFamily: '"DM Sans", sans-serif' }}
        >
          {title}
        </p>
        {sub && (
          <p
            className="text-[12px] leading-tight mt-[2px]"
            style={{ color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}
          >
            {sub}
          </p>
        )}
      </div>
      {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
    </div>
  )
}
