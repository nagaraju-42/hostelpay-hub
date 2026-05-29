import { Toaster } from 'sonner'
import type { ReactNode } from 'react'

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        maxWidth: 430,
        margin: '0 auto',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        position: 'relative',
      }}
    >
      {children}
      <Toaster position="top-center" richColors />
    </div>
  )
}
