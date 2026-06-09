import { supabaseAdmin } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Params {
  hostelId: string
}

// ── Metadata (SEO) ─────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { hostelId } = await params
  const { data } = await supabaseAdmin
    .from('hostel_owners')
    .select('hostel_name')
    .eq('id', hostelId)
    .single()

  if (!data) {
    return {
      title: 'Invalid QR Code | HostelPay Hub',
    }
  }

  return {
    title: `Join ${data.hostel_name} | HostelPay Hub`,
    description: `You've been invited to join ${data.hostel_name} on HostelPay Hub. Tap to create your student account.`,
  }
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function HostelQRPage({ params }: { params: Promise<Params> }) {
  const { hostelId } = await params

  const { data: hostel, error } = await supabaseAdmin
    .from('hostel_owners')
    .select('id, hostel_name')
    .eq('id', hostelId)
    .single()

  // ── Not Found ──────────────────────────────────────────────────────────
  if (error || !hostel) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: 'linear-gradient(160deg, #0F2744 0%, #1a3a5c 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          gap: 16,
        }}
      >
        <span style={{ fontSize: 60 }}>❌</span>
        <h1
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 24,
            color: '#fff',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Invalid QR Code
        </h1>
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          This QR code doesn&apos;t match any registered hostel. Please ask your hostel owner for a new QR code.
        </p>
        <a
          href="/s"
          style={{
            marginTop: 8,
            padding: '12px 28px',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          Go to Student Portal
        </a>
      </div>
    )
  }

  const joinUrl = `/s/join?owner=${hostel.id}`

  // ── Valid Hostel Page ──────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .join-btn:hover {
          background: #D97706 !important;
          box-shadow: 0 8px 24px rgba(245,158,11,0.4) !important;
          transform: translateY(-2px);
        }
        .join-btn { transition: all 0.2s ease; }
      `}</style>

      <div
        style={{
          minHeight: '100dvh',
          background: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          gap: 0,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        {/* Background decorations */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(37,99,235,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(37,99,235,0.04)', pointerEvents: 'none' }} />

        {/* Hero icon */}
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: 24,
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 44,
            animation: 'pulse 3s ease-in-out infinite',
            marginBottom: 20,
          }}
        >
          🏨
        </div>

        {/* Invited subtitle */}
        <p
          style={{
            margin: '0 0 8px',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: '#2563EB',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            animation: 'fadeUp 0.5s ease 0.1s both',
          }}
        >
          You&apos;ve been invited to join
        </p>

        {/* Hostel name */}
        <h1
          style={{
            margin: '0 0 32px',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 32,
            fontWeight: 700,
            color: '#1E293B',
            textAlign: 'center',
            lineHeight: 1.2,
            animation: 'fadeUp 0.5s ease 0.2s both',
          }}
        >
          {hostel.hostel_name}
        </h1>

        {/* White card */}
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            background: '#fff',
            borderRadius: 20,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'fadeUp 0.5s ease 0.3s both',
          }}
        >
          {/* Hostel name repeat */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: '#F8FAFC',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              🏨
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Hostel
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#1E293B',
                }}
              >
                {hostel.hostel_name}
              </p>
            </div>
          </div>

          {/* Instruction */}
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: '#64748B',
              lineHeight: 1.7,
              textAlign: 'center',
            }}
          >
            Tap below to join this hostel and set up your student account. You can manage your payments, view rent details, and much more.
          </p>

          {/* Join button */}
          <a
            href={joinUrl}
            className="join-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '16px',
              background: '#2563EB',
              border: 'none',
              borderRadius: 12,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 16,
              fontWeight: 600,
              color: '#fff',
              textDecoration: 'none',
              textAlign: 'center' as const,
            }}
          >
            🏠 Join {hostel.hostel_name}
          </a>

          {/* Login link for existing students */}
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748B', fontFamily: '"DM Sans", sans-serif' }}>
              Already registered?{' '}
              <a href="/s" style={{ color: '#0F2744', fontWeight: 700, textDecoration: 'underline' }}>
                Login here
              </a>
            </p>
          </div>

          {/* Footnote */}
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: '#94A3B8',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            🔒 You&apos;ll need to sign in with Google to continue. Your data is secure.
          </p>
        </div>

        {/* Brand footer */}
        <p
          style={{
            marginTop: 28,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: '#94A3B8',
            textAlign: 'center',
          }}
        >
          Powered by <strong style={{ color: '#64748B' }}>HostelPay Hub</strong>
        </p>
      </div>
    </>
  )
}
