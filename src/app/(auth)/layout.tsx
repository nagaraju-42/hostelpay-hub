import type { ReactNode } from 'react'

// ── Sahara Auth Layout ────────────────────────────────────────────────
// Warm linen gradient background — no cold blue/slate
// Radial warmth: centre is brighter linen, edges subtle sienna wash

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      className='min-h-screen flex items-center justify-center p-4'
      style={{
        background: 'radial-gradient(ellipse at 60% 40%, #fdf6ec 0%, #f5e8d4 50%, #ede0cc 100%)',
      }}
    >
      {children}
    </main>
  )
}