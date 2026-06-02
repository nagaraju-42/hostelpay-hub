'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { TopBar } from '@/components/mobile/TopBar'
import { StatCard } from '@/components/mobile/StatCard'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import type { LedgerExportData } from '@/app/api/export/ledger/route'
import type { ExportData as MonthlyExportData } from '@/app/api/export/payments/route'

type ReportType = 'monthly_summary' | 'complete_khata'

const REPORT_TYPES: { key: ReportType; icon: string; label: string; sub: string }[] = [
  { key: 'complete_khata',  icon: '📖', label: 'Complete Khata Book',  sub: 'All students. Page-by-page ledger' },
  { key: 'monthly_summary', icon: '📊', label: 'Monthly Summary',      sub: 'Basic overview of single month'    },
]

export default function ExportPage() {
  const now          = new Date()
  const currentMonth = format(now, 'yyyy-MM')

  const [month,       setMonth]       = useState(currentMonth)
  const [reportType,  setReportType]  = useState<ReportType>('complete_khata')
  
  // Data States
  const [ledgerData,  setLedgerData]  = useState<LedgerExportData | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyExportData | null>(null)
  
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function fetchExportData() {
    setLoading(true)
    setError('')
    setLedgerData(null)
    setMonthlyData(null)
    try {
      if (reportType === 'complete_khata') {
        const res = await fetch('/api/export/ledger')
        const json = await res.json()
        if (!res.ok) { setError(json.error || 'Failed to load data.'); return }
        setLedgerData(json.data)
      } else {
        const res = await fetch(`/api/export/payments?month=${month}`)
        const json = await res.json()
        if (!res.ok) { setError(json.error || 'Failed to load data.'); return }
        setMonthlyData(json.data)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Khata Book Downloads ────────────────────────────────────────────────
  function downloadKhataPDF() {
    if (!ledgerData) return
    const doc = new jsPDF()

    ledgerData.students.forEach((student, index) => {
      if (index > 0) doc.addPage()

      // Header
      doc.setFontSize(18)
      doc.setTextColor(15, 39, 68)
      doc.text(`${ledgerData.hostel_name} — Khata Ledger`, 14, 22)
      
      doc.setFontSize(12)
      doc.setTextColor(30, 41, 59)
      doc.text(`Student: ${student.student_name} (Room ${student.room_number})`, 14, 32)
      
      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(`Join Date: ${new Date(student.date_of_joining).toLocaleDateString()}  |  Rent: Rs. ${student.rent_amount}`, 14, 38)
      doc.text(`Generated: ${ledgerData.generated_at}`, 14, 44)

      // Ledger Table
      autoTable(doc, {
        head: [['Date', 'Description', 'Charges', 'Payments', 'Balance']],
        body: student.ledger.map(row => {
          let balStr = `Rs. ${Math.abs(row.balance)}`
          if (row.balance > 0) balStr += ' (Owed)'
          else if (row.balance < 0) balStr += ' (Advance)'
          return [
            row.date,
            row.particulars,
            row.charges !== null ? `Rs. ${row.charges}` : '',
            row.payments !== null ? `Rs. ${row.payments}` : '',
            balStr
          ]
        }),
        startY: 50,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [15, 39, 68] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' }
        }
      })
    })

    doc.save(`${ledgerData.hostel_name}-Khata-Book.pdf`)
  }

  function downloadKhataCSV() {
    if (!ledgerData) return
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'Student Name,Room,Date,Particulars,Charges,Payments,Balance\n'

    ledgerData.students.forEach(student => {
      student.ledger.forEach(row => {
        const charges = row.charges !== null ? row.charges : ''
        const payments = row.payments !== null ? row.payments : ''
        csvContent += `"${student.student_name}","${student.room_number}","${row.date}","${row.particulars}","${charges}","${payments}","${row.balance}"\n`
      })
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${ledgerData.hostel_name}-Khata-Book.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ── Monthly Summary Downloads ───────────────────────────────────────────
  function downloadMonthlyPDF() {
    if (!monthlyData) return
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.setTextColor(15, 39, 68)
    doc.text(`${monthlyData.hostel_name} — Monthly Summary`, 14, 22)
    doc.setFontSize(10)
    doc.text(`Month: ${monthlyData.month}   |   Generated: ${monthlyData.generated_at}`, 14, 30)

    autoTable(doc, {
      head: [['Student', 'Room', 'Rent', 'Paid', 'Mode', 'Date', 'Status']],
      body: monthlyData.rows.map(r => [
        r.student_name, r.room_number,
        `Rs. ${r.rent_amount}`,
        r.amount_paid > 0 ? `Rs. ${r.amount_paid}` : '—',
        r.payment_mode, r.paid_date || '—', 
        r.status,
      ]),
      startY: 40,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 39, 68] },
    })
    doc.save(`${monthlyData.hostel_name}-${monthlyData.month}-Summary.pdf`)
  }

  function downloadMonthlyCSV() {
    if (!monthlyData) return
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'Student Name,Room,Rent Amount,Amount Paid,Payment Mode,Paid Date,Status\n'
    monthlyData.rows.forEach(r => {
      csvContent += `"${r.student_name}","${r.room_number}","${r.rent_amount}","${r.amount_paid}","${r.payment_mode}","${r.paid_date}","${r.status}"\n`
    })
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${monthlyData.hostel_name}-${monthlyData.month}-Summary.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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

        {/* ── Month Picker (Only for Monthly Summary) ── */}
        {reportType === 'monthly_summary' && (
          <>
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
          </>
        )}

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
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : '🔍 Generate Report'}
        </button>

        {/* ── Error ── */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
            <p style={{ color: '#991B1B', fontSize: 13, fontFamily: '"DM Sans", sans-serif' }}>{error}</p>
          </div>
        )}

        {/* ── Khata Results ── */}
        {ledgerData && reportType === 'complete_khata' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: '"DM Sans", sans-serif', marginBottom: 2 }}>{ledgerData.hostel_name} - Khata Book</div>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginBottom: 12 }}>Includes {ledgerData.students.length} students</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                <button onClick={downloadKhataCSV} style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: 12, padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <FileSpreadsheet size={16} /> Download CSV
                </button>
                <button onClick={downloadKhataPDF} style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 12, padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <FileText size={16} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Monthly Results ── */}
        {monthlyData && reportType === 'monthly_summary' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: '"DM Sans", sans-serif', marginBottom: 2 }}>{monthlyData.hostel_name}</div>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginBottom: 12 }}>{monthlyData.month}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 14 }}>
                <StatCard value={monthlyData.summary.paid_count} label="Paid" color="#059669" />
                <StatCard value={monthlyData.summary.unpaid_count} label="Unpaid" color="#991B1B" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                <button onClick={downloadMonthlyCSV} style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: 12, padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <FileSpreadsheet size={16} /> Download CSV
                </button>
                <button onClick={downloadMonthlyPDF} style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 12, padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <FileText size={16} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
