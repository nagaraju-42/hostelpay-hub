import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Sahara LoadingSpinner ─────────────────────────────────────────────
// Single source of truth for all spinners in the app.
// size="sm"  → fits inside buttons (16px)
// size="md"  → standalone inline use (24px)
// size="lg"  → page-level overlays (36px)

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-9 h-9',
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  return (
    <span className={cn('inline-flex flex-col items-center gap-2', className)}>
      <Loader2
        className={cn(
          sizeMap[size],
          'animate-spin text-[#c2652a]',  // Sahara sienna
        )}
      />
      {label && (
        <span className='text-sm font-sans text-[#8a7060] animate-pulse'>{label}</span>
      )}
    </span>
  )
}
