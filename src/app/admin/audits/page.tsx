import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AdminAuditsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    redirect('/login')
  }

  // Fetch all audit notifications using supabaseAdmin to bypass RLS
  const { data: audits, error } = await supabaseAdmin
    .from('notifications')
    .select('*, hostel_owners(full_name, hostel_name)')
    .like('type', 'audit_%')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Error fetching audits:', error)
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', fontFamily: '"DM Serif Display", serif', marginBottom: 8 }}>
          System Audits
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
          Log of sensitive actions performed by hostel owners.
        </p>
      </div>

      <div style={{
        background: '#111827',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden'
      }}>
        {(!audits || audits.length === 0) ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            No audit logs found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: 12, textTransform: 'uppercase' }}>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Action Time</th>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Hostel Owner</th>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Action Type</th>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit: any) => (
                <tr key={audit.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                  <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{format(new Date(audit.created_at), 'MMM d, yyyy')}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{format(new Date(audit.created_at), 'h:mm a')}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 500, color: '#F59E0B' }}>{audit.hostel_owners?.full_name || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{audit.hostel_owners?.hostel_name || 'Unknown Hostel'}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{
                      display: 'inline-block', padding: '4px 8px', borderRadius: 6,
                      background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: 11, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                      {audit.type.replace('audit_', '').replace(/_/g, ' ')}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.6)' }}>
                    {audit.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
