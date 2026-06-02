'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { TopBar } from '@/components/mobile/TopBar'
import { StatCard } from '@/components/mobile/StatCard'
import { CSVLink } from 'react-csv'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExportData } from '@/app/api/export/payments/route'
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react'

type ReportType = 'monthly' | 'student' | 'overdue'

const REPORT_TYPES: { key: ReportType; icon: string; label: string; sub: string }[] = [
  { key: 'monthly', icon: '📅', label: 'Monthly payment report',  sub: 'All students for a given month' },
  { key: 'student', icon: '🔍', label: 'Student statement',        sub: 'Individual payment history'     },
  { key: 'overdue', icon: '📈', label: 'Overdue summary',          sub: 'Outstanding & pending dues'     },
]

export default function ExportPage() {
  const now          = new Date()
  const currentMonth = format(now, 'yyyy-MM')

  const [month,       setMonth]       = useState(currentMonth)
  const [reportType,  setReportType]  = useState<ReportType>('monthly')
  const [data,        setData]        = useState<ExportData | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function fetchExportData() {
    setLoading(true)
    setError('')
    setData(null)
    try {
      const res  = await fetch(`/api/export/payments?month=${month}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load data.'); return }
      setData(json.data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function downloadPDF() {
    if (!data) return
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.setTextColor(15, 39, 68)
    doc.text(`${data.hostel_name} — Payment Report`, 14, 22)
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Month: ${data.month}   |   Generated: ${data.generated_at}`, 14, 30)
    doc.setTextColor(30, 41, 59)
    doc.text(`Students: ${data.summary.total_students}  |  Paid: ${data.summary.paid_count}  |  Unpaid: ${data.summary.unpaid_count}`, 14, 38)
    doc.text(`Total Collected: Rs. ${data.summary.total_collected.toLocaleString('en-IN')}`, 14, 44)

    autoTable(doc, {
      head: [['Student', 'Room', 'Rent', 'Paid', 'Mode', 'Date', 'Status']],
      body: data.rows.map(r => [
        r.student_name, r.room_number,
        `Rs. ${r.rent_amount}`,
        r.amount_paid > 0 ? `Rs. ${r.amount_paid}` : '—',
        r.payment_mode, r.paid_date || '—', 
        r.date_of_leaving ? `Left Hostel (${new Date(r.date_of_leaving).toLocaleDateString('en-IN', {day:'2-digit', month:'short'})})` : r.status,
      ]),
      startY: 50,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 39, 68] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })

    doc.save(`${data.hostel_name}-${data.month}-Report.pdf`)
  }

  const csvHeaders = [
    { label: 'Student Name',  key: 'student_name' },
    { label: 'Room',          key: 'room_number'  },
    { label: 'Phone',         key: 'phone'        },
    { label: 'Rent Amount',   key: 'rent_amount'  },
    { label: 'Amount Paid',   key: 'amount_paid'  },
    { label: 'Payment Mode',  key: 'payment_mode' },
    { label: 'Paid Date',     key: 'paid_date'    },
    { label: 'Due Date',      key: 'due_date'     },
    { label: 'Notes',         key: 'notes'        },
    { label: 'Status',        key: 'status'       },
  ]

  const fmtAmount = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${Math.round(n / 1000)}K` : `₹${n}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar title="Reports &amp; export" backHref="/dashboard/history" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 24px', WebkitOverflowScrolling: 'touch' as const }}>

        {/* ── Report Type ── */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 10 }}>
          REPORT TYPE
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
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
                {active && <span style={{ fontSize: 16 }}>✅</span>}
              </button>
            )
          })}
        </div>

        {/* ── Month Picker ── */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 7 }}>
          SELECT MONTH
        </div>
        <input
          type="month"
          value={month}
          max={currentMonth}
          onChange={e => setMonth(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12,
            border: '1px solid #E2E8F0', background: '#F8FAFC',
            fontSize: 14, fontFamily: '"DM Sans", sans-serif', color: '#1E293B',
            boxSizing: 'border-box', marginBottom: 18, outline: 'none',
          }}
        />

        {/* ── Load button ── */}
        <button
          onClick={fetchExportData}
          disabled={loading}
          style={{
            width: '100%', background: loading ? '#334155' : '#0F2744',
            color: '#fff', border: 'none', padding: '14px', borderRadius: 12,
            fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxSizing: 'border-box', marginBottom: 18, minHeight: 50, transition: 'background 0.2s',
          }}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : '🔍 Load Report Data'}
        </button>

        {/* ── Error ── */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
            <p style={{ color: '#991B1B', fontSize: 13, fontFamily: '"DM Sans", sans-serif' }}>{error}</p>
          </div>
        )}

        {/* ── Results ── */}
        {data && (
          <>
            {/* Summary Cards */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: '"DM Sans", sans-serif', marginBottom: 2 }}>{data.hostel_name}</div>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginBottom: 12 }}>{data.month} · Generated {data.generated_at}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                <StatCard value={data.summary.total_students}                              label="Total students" color="#0F2744" />
                <StatCard value={data.summary.paid_count}                                  label="Paid"           color="#059669" />
                <StatCard value={data.summary.unpaid_count}                                label="Unpaid"         color="#991B1B" />
                <StatCard value={fmtAmount(data.summary.total_collected)}                  label="Collected"      color="#059669" />
              </div>
            </div>

            {/* Download Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 14 }}>
              <CSVLink
                data={data.rows}
                headers={csvHeaders}
                filename={`${data.hostel_name}-${data.month}.csv`}
                style={{
                  background: '#ECFDF5', color: '#065F46',
                  border: '1px solid #A7F3D0', borderRadius: 12, padding: '13px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontSize: 13, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
                  textDecoration: 'none', minHeight: 50,
                }}
              >
                <FileSpreadsheet size={16} /> CSV / Excel
              </CSVLink>
              <button
                onClick={downloadPDF}
                style={{
                  background: '#FEF2F2', color: '#991B1B',
                  border: '1px solid #FECACA', borderRadius: 12, padding: '13px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontSize: 13, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
                  cursor: 'pointer', minHeight: 50,
                }}
              >
                <FileText size={16} /> PDF
              </button>
            </div>

            {/* WhatsApp Share */}
            <button
              style={{
                width: '100%', background: '#F0FDF4', color: '#065F46',
                border: '1px solid #A7F3D0', borderRadius: 12, padding: '13px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 13, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
                cursor: 'pointer', boxSizing: 'border-box', marginBottom: 18, minHeight: 50,
              }}
            >
              💬 Share via WhatsApp
            </button>

            {/* Preview Table */}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.5px', marginBottom: 8 }}>
              PREVIEW ({data.rows.length} rows)
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480, fontSize: 12, fontFamily: '"DM Sans", sans-serif' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      {['Student', 'Room', 'Rent', 'Paid', 'Mode', 'Date', 'Status'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#64748B', fontWeight: 700, fontSize: 10, letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: i < data.rows.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap' }}>{row.student_name}</td>
                        <td style={{ padding: '9px 12px', color: '#64748B', textAlign: 'center' }}>{row.room_number}</td>
                        <td style={{ padding: '9px 12px', color: '#64748B', textAlign: 'right', whiteSpace: 'nowrap' }}>₹{Number(row.rent_amount).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap', color: row.amount_paid > 0 ? '#059669' : '#94A3B8' }}>
                          {row.amount_paid > 0 ? `₹${Number(row.amount_paid).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td style={{ padding: '9px 12px', color: '#64748B', textAlign: 'center', fontSize: 11 }}>{row.payment_mode}</td>
                        <td style={{ padding: '9px 12px', color: '#64748B', whiteSpace: 'nowrap' }}>{row.paid_date || '—'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                            <span style={{
                              background: row.status === 'Paid' ? '#ECFDF5' : '#FEF2F2',
                              color:      row.status === 'Paid' ? '#065F46' : '#991B1B',
                              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                            }}>
                              {row.status}
                            </span>
                            {row.date_of_leaving && (
                              <span style={{
                                background: '#F1F5F9', color: '#475569',
                                fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap'
                              }}>
                                Left: {new Date(row.date_of_leaving).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
