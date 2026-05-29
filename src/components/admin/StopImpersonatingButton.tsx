'use client'

export function StopImpersonatingButton() {
  return (
    <button
      onClick={() => {
        fetch('/api/admin/impersonate', { method: 'POST', body: JSON.stringify({}) })
          .then(() => window.location.href = '/admin')
      }}
      style={{
        background: 'rgba(0,0,0,0.1)',
        border: 'none',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      Stop
    </button>
  )
}
