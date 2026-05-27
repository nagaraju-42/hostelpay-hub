// ── Sahara BottomActionBar ────────────────────────────────────────────
// Sticky bottom bar for primary mobile CTAs.
//
// Usage pattern:
//   <BottomActionBar>
//     <Button size="lg" className="w-full">Add Student</Button>
//   </BottomActionBar>
//
// • Visible ONLY on mobile (hidden sm:hidden — rendered on ≤639px)
// • Sits above system safe-area (handles iPhone home bar + notch)
// • Warm white bg, subtle top border, soft shadow upward
// • Counterpart: the same action should still appear in the desktop header

interface BottomActionBarProps {
  children: React.ReactNode
  className?: string
}

export function BottomActionBar({ children, className }: BottomActionBarProps) {
  return (
    <>
      {/* Mobile sticky bar */}
      <div
        className={[
          'fixed bottom-0 left-0 right-0 z-40',
          'sm:hidden',                                        // hide on desktop
          'bg-[#fffcf8]',
          'border-t border-[rgba(216,208,200,0.70)]',
          'px-4 pt-3 pb-safe',                               // pb-safe = env(safe-area-inset-bottom)
          'shadow-[0_-2px_16px_rgba(58,48,42,0.06)]',
          className ?? '',
        ].join(' ')}
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {children}
      </div>

      {/* Ghost spacer so content isn't hidden behind the bar */}
      <div className='h-20 sm:hidden' aria-hidden='true' />
    </>
  )
}
