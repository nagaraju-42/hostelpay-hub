import type { ReactNode } from 'react'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton'

const NAV_LINKS = [
  { href: '/admin',           icon: '📊', label: 'Platform Overview'   },
  { href: '/admin/owners',    icon: '🏢', label: 'Hostel Management'   },
  { href: '/admin/owners',    icon: '👥', label: 'Owner Accounts'      },
  { href: '/admin',           icon: '📈', label: 'Revenue Analytics'   },
  { href: '/admin',           icon: '📤', label: 'Global Export'       },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    redirect('/login')
  }

  // Fetch count of open support tickets
  const { count: openTicketsCount } = await supabaseAdmin
    .from('support_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open')

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 256, minHeight: '100vh', background: '#111827',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, background: '#F59E0B',
              borderRadius: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18, flexShrink: 0,
            }}>🏨</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 400, color: '#fff', fontFamily: '"DM Serif Display", serif' }}>
                HostelPay<span style={{ color: '#F59E0B' }}>Hub</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: '"DM Sans", sans-serif' }}>
                Super Admin Panel
              </div>
            </div>
          </div>
          {/* GOD MODE badge */}
          <div style={{
            background: '#F59E0B', color: '#111',
            padding: '4px 10px', borderRadius: 8,
            fontSize: 11, fontWeight: 800,
            fontFamily: '"DM Sans", sans-serif',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            ⚡ GOD MODE
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {NAV_LINKS.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                fontSize: 13, fontFamily: '"DM Sans", sans-serif',
                color: 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
              className="admin-nav-link"
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{link.icon}</span>
              {link.label}
            </Link>
          ))}

          <Link
            href="/admin/support"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, marginBottom: 2,
              fontSize: 13, fontFamily: '"DM Sans", sans-serif',
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
              justifyContent: 'space-between'
            }}
            className="admin-nav-link"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>🎫</span>
              Support Tickets
            </div>
            {openTicketsCount !== null && openTicketsCount > 0 && (
              <span style={{
                background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700,
                padding: '2px 6px', borderRadius: 10, display: 'inline-block'
              }}>
                {openTicketsCount}
              </span>
            )}
          </Link>
        </nav>

        {/* User info */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11, color: 'rgba(255,255,255,0.35)',
          fontFamily: '"DM Sans", sans-serif',
          wordBreak: 'break-all',
        }}>
          {user.email}
          <AdminLogoutButton />
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, minHeight: '100vh', overflowY: 'auto' }}>
        {/* Top bar */}
        <div style={{
          background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 32px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Sans", sans-serif' }}>
            Super Admin · Control Panel
          </div>
          <div style={{
            background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
            padding: '4px 10px', borderRadius: 6,
            fontSize: 11, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
          }}>
            ADMIN
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: '32px' }}>
          {children}
        </div>
      </main>

      <style>{`
        .admin-nav-link:hover {
          background: rgba(255,255,255,0.06) !important;
          color: #fff !important;
        }
      `}</style>
    </div>
  )
}