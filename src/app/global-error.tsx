'use client'
 
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html>
      <body>
        <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', fontFamily:'Arial,sans-serif' }}>
          <div style={{ textAlign:'center', maxWidth:'320px' }}>
            <h1 style={{ fontSize:'1.5rem', fontWeight:'bold', color:'#0F172A', marginBottom:'0.5rem' }}>
              Critical Error
            </h1>
            <p style={{ color:'#64748B', fontSize:'0.875rem', marginBottom:'1.5rem' }}>
              HostelPayHub encountered a critical error. Please refresh the page.
            </p>
            <button onClick={reset}
              style={{ background:'#1A56DB', color:'white', border:'none', borderRadius:'0.5rem',
                       padding:'0.75rem 1.5rem', cursor:'pointer', fontSize:'0.875rem' }}>
              Refresh Page
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}