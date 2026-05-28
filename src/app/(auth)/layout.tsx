import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0F2744 50%, #0a1628 100%)' }}
    >
      {/* Mobile shell constraint */}
      <div className="w-full max-w-[430px] min-h-screen flex flex-col">
        {children}
      </div>
    </main>
  )
}