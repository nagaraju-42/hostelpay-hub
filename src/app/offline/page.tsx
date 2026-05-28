'use client'

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #0F2744 0%, #163354 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', textAlign: 'center',
      fontFamily: '"DM Sans", sans-serif',
    }}>
      <div style={{
        width: 80, height: 80, background: 'rgba(255,255,255,0.1)',
        borderRadius: 24, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 40, marginBottom: 24,
      }}>
        📵
      </div>
      <h1 style={{
        fontFamily: '"DM Serif Display", serif',
        fontSize: 24, fontWeight: 400, color: '#fff', margin: '0 0 12px',
      }}>
        You&apos;re offline
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, maxWidth: 280, margin: '0 0 32px' }}>
        HostelPay Hub needs an internet connection to sync payment data. Please check your connection.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: '#F59E0B', color: '#111', border: 'none',
          padding: '14px 28px', borderRadius: 12,
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        🔄 Try again
      </button>
    </div>
  )
}
