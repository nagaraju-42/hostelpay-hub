'use client'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// ── Sahara PageLoader ─────────────────────────────────────────────────
// Full-screen warm-tinted overlay used for:
//   • Mark-as-Paid confirmation (prevents double-tap payments)
//   • Form submissions (add/edit student, create owner)
//   • Export PDF generation (can take 500–1000ms)
//   • Page-level data fetching where skeletons aren't appropriate

interface PageLoaderProps {
  label?: string
}

export function PageLoader({ label = 'Loading...' }: PageLoaderProps) {
  return (
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center'
      style={{
        // Warm linen tint — not cold white or black
        background: 'rgba(250, 245, 238, 0.85)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      // Prevent scroll while overlay is showing
      aria-busy='true'
      aria-label={label}
    >
      <div
        className='bg-[#fffcf8] rounded-2xl border border-[rgba(216,208,200,0.70)] px-8 py-7 flex flex-col items-center gap-3'
        style={{ boxShadow: '0 8px 40px rgba(58, 48, 42, 0.12)' }}
      >
        <LoadingSpinner size='lg' />
        <p className='text-sm font-semibold font-sans text-[#5c3d2a] animate-pulse text-center max-w-[160px]'>
          {label}
        </p>
      </div>
    </div>
  )
}
