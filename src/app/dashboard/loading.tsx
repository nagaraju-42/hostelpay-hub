import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// ── Sahara Dashboard Loading ──────────────────────────────────────────
// Next.js route-level loading.tsx — shows while layout server components run

export default function DashboardLoading() {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'
      style={{ background: 'rgba(250, 245, 238, 0.80)', backdropFilter: 'blur(3px)' }}>
      <div className='bg-[#fffcf8] rounded-2xl border border-[rgba(216,208,200,0.70)] px-8 py-7 flex flex-col items-center gap-3'
        style={{ boxShadow: '0 8px 40px rgba(58, 48, 42, 0.10)' }}>
        <LoadingSpinner size='lg' />
        <p className='text-sm font-semibold font-sans text-[#5c3d2a] animate-pulse'>Loading data...</p>
      </div>
    </div>
  )
}