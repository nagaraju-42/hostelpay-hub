'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { TopBar } from '@/components/mobile/TopBar'
import { StatCard } from '@/components/mobile/StatCard'

type ReportType = 'monthly' | 'student' | 'overdue'
type ExportFormat = 'csv' | 'pdf'

const REPORT_TYPES = [
  { key: 'monthly' as ReportType, icon: '📅', label: 'Monthly payment report',  sub: 'All students for a given month' },
  { key: 'student' as ReportType, icon: '🔍', label: 'Student statement',        sub: 'Individual payment history'     },
  { key: 'overdue' as ReportType, icon: '📈', label: 'Overdue summary',          sub: 'Outstanding & pending dues'     },
]

export default function ExportPage() {
  const router = useRouter()
  const [reportType,   setReportType]   = useState<ReportType>('monthly')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [loading,      setLoading]      = useState(false)
  const [preview,      setPreview]      = useState<{ paid: number; overdue: number; collected: number; outstanding: number } | null>(null)

  const now   = new Date()
  const start = format(startOfMonth(now), 'yyyy-MM-dd')
  const end   = format(endOfMonth(now),   'yyyy-MM-dd')

  useEffect(() => {
    // Fetch a rough preview from the summary endpoint
    fetch('/api/payments/summary')
      .then(r => r.json())
      .then(({ data }) => {
        if (data) {
          setPreview({
            paid:        data.total_count ?? 0,
            overdue:     0,
            collected:   data.total_amount ?? 0,
            outstanding: 0,
          })
        }
      })
      .catch(() => {})
  }, [])

  async function handleDownload() {
    setLoading(true)
    // Trigger existing export API
    try {
      const res = await fetch(`/api/export?format=${exportFormat}&type=${reportType}&start=${start}&end=${end}`)
      if (!res.ok) { setLoading(false); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `hostelpay-${reportType}-${format(now, 'yyyy-MM')}.${exportFormat === 'csv' ? 'csv' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fmtAmount = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : n >= 1000 ? `₹${Math.round(n / 1000)}K` : `₹${n}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar title="Reports &amp; export" backHref="/dashboard/history" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 24px', WebkitOverflowScrolling: 'touch' as const }}>

        {/* Report Type */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 10 }}>
          REPORT TYPE
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {REPORT_TYPES.map(r => {
            const active = reportType === r.key
            return (
              <button
                key={r.key}
                onClick={() => setReportType(r.key)}
                style={{
                  padding: '13px 14px', borderRadius: 12,
                  border: active ? '2px solid #0F2744' : '1px solid #E2E8F0',
                  background: active ? '#EEF2FF' : '#F8FAFC',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box',
                  width: '100%', minHeight: 44,
                }}
              >
                <span style={{ fontSize: 22 }}>{r.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#0F2744' : '#334155', fontFamily: '"DM Sans", sans-serif' }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: active ? '#4338CA' : '#64748B', fontFamily: '"DM Sans", sans-serif' }}>{r.sub}</div>
                </div>
                {active && <span style={{ fontSize: 18 }}>✅</span>}
              </button>
            )
          })}
        </div>

        {/* Period */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 8 }}>
          PERIOD
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 20 }}>
          {[`📅 ${format(startOfMonth(now), 'd MMM yyyy')}`, `📅 ${format(endOfMonth(now), 'd MMM yyyy')}`].map((d, i) => (
            <div key={i} style={{ padding: '12px 13px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 13, fontFamily: '"DM Sans", sans-serif', color: '#64748B' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Format */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 8 }}>
          FORMAT
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 20 }}>
          {([['csv', '📊', 'CSV / Excel', '#ECFDF5', '#065F46', '#059669'], ['pdf', '📄', 'PDF', '#F8FAFC', '#64748B', '#E2E8F0']] as const).map(([fmt, icon, label, bg, txt, borderColor]) => (
            <button
              key={fmt}
              onClick={() => setExportFormat(fmt as ExportFormat)}
              style={{
                padding: '11px 12px', borderRadius: 12,
                border: exportFormat === fmt ? `2px solid ${borderColor}` : '1px solid #E2E8F0',
                background: exportFormat === fmt ? bg : '#F8FAFC',
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', minHeight: 44,
              }}
            >
              <span style={{ fontSize: 17 }}>{icon}</span>
              <span style={{ fontSize: 12, fontWeight: exportFormat === fmt ? 700 : 400, color: exportFormat === fmt ? txt : '#64748B', fontFamily: '"DM Sans", sans-serif' }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Preview */}
        {preview && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 8 }}>
              REPORT PREVIEW — {format(now, 'MMM yyyy').toUpperCase()}
            </div>
            <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                <StatCard value={preview.paid}                      label="Paid entries"  color="#0F2744" />
                <StatCard value={preview.overdue}                   label="Overdue"       color="#991B1B" />
                <StatCard value={fmtAmount(preview.collected)}      label="Collected"     color="#059669" />
                <StatCard value={fmtAmount(preview.outstanding)}    label="Outstanding"   color="#991B1B" />
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <button
          onClick={handleDownload}
          disabled={loading}
          style={{
            width: '100%', background: loading ? '#334155' : '#0F2744',
            color: '#fff', border: 'none', padding: '14px', borderRadius: 12,
            fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxSizing: 'border-box', minHeight: 50, marginBottom: 10, transition: 'background 0.2s',
          }}
        >
          {loading ? 'Generating…' : '📥 Download report'}
        </button>

        <button
          style={{
            width: '100%', background: '#F0FDF4', color: '#065F46',
            border: '1px solid #A7F3D0', padding: '14px', borderRadius: 12,
            fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxSizing: 'border-box', marginBottom: 8, minHeight: 50,
          }}
        >
          💬 Share via WhatsApp
        </button>
      </div>
    </div>
  )
}
