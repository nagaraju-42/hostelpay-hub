'use client'
 
import { useState } from 'react'
import { CSVLink } from 'react-csv'
import { FileSpreadsheet, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ExportData } from '@/app/api/export/payments/route'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
 
export default function ExportPage() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [month,       setMonth]       = useState(currentMonth)
  const [data,        setData]        = useState<ExportData | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
 
  async function fetchExportData() {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`/api/export/payments?month=${month}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load data.'); return }
      setData(json.data)
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }
 
  // ── UPGRADED NATIVE PDF GENERATOR ───────────────────────────────────────
  function downloadPDF() {
    if (!data) return
    
    const doc = new jsPDF()
    
    // 1. Add Headers
    doc.setFontSize(18)
    doc.setTextColor(30, 41, 59) // slate-800
    doc.text(`${data.hostel_name} - Payment Report`, 14, 22)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139) // slate-500
    doc.text(`Month: ${data.month}   |   Generated: ${data.generated_at}`, 14, 30)
    
    // 2. Add Summary Stats
    doc.setTextColor(15, 23, 42) // slate-900
    doc.text(`Total Students: ${data.summary.total_students}   |   Paid: ${data.summary.paid_count}   |   Unpaid: ${data.summary.unpaid_count}`, 14, 38)
    doc.text(`Total Collected: Rs. ${data.summary.total_collected.toLocaleString('en-IN')}`, 14, 44)
 
    // 3. Build Table Data
    const tableColumn = ["Student Name", "Room", "Rent", "Amount Paid", "Mode", "Date", "Status"]
    const tableRows = data.rows.map(row => [
      row.student_name,
      row.room_number,
      `Rs. ${row.rent_amount}`,
      row.amount_paid > 0 ? `Rs. ${row.amount_paid}` : '-',
      row.payment_mode,
      row.paid_date || '-',
      row.status
    ])
 
    // 4. Draw Table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235] }, // blue-600
      alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
    })
 
    // 5. Save File
    doc.save(`${data.hostel_name}-${data.month}-Report.pdf`)
  }
 
  // CSV headers and data
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
 
  const fileName = data ? `${data.hostel_name}-${data.month}.csv` : 'export.csv'
 
  return (
    <div className='space-y-6 max-w-4xl mx-auto'>
 
      <div>
        <h1 className='text-2xl font-bold text-slate-800'>Export Reports</h1>
        <p className='text-slate-500 text-sm mt-1'>Download monthly payment reports as CSV or PDF.</p>
      </div>
 
      <div className='bg-white rounded-2xl border border-slate-200 p-5'>
        <div className='flex flex-wrap items-end gap-3'>
          <div className='space-y-1.5 flex-1 min-w-[160px]'>
            <label className='text-sm font-medium text-slate-700'>Select Month</label>
            <input type='month' value={month} onChange={e => setMonth(e.target.value)}
              max={currentMonth}
              className='w-full h-11 rounded-lg border border-slate-200 px-3 text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white' />
          </div>
          <Button onClick={fetchExportData} disabled={loading}
            className='h-11 bg-blue-600 hover:bg-blue-500 gap-2'>
            {loading ? <><Loader2 className='w-4 h-4 animate-spin'/>Loading...</> : 'Load Report'}
          </Button>
        </div>
      </div>
 
      {error && (
        <div className='flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm'>
          <AlertCircle className='w-4 h-4 flex-shrink-0' />{error}
        </div>
      )}
 
      {data && (
        <div className='space-y-4'>
          <div className='bg-white rounded-2xl border border-slate-200 p-5'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h2 className='font-semibold text-slate-800'>{data.hostel_name} — {data.month}</h2>
                <p className='text-slate-400 text-xs mt-0.5'>Generated {data.generated_at}</p>
              </div>
              <div className='flex gap-2'>
                <CSVLink
                  data={data.rows} headers={csvHeaders} filename={fileName}
                  className='inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-green-600
                             hover:bg-green-500 text-white text-sm font-medium transition-colors'>
                  <FileSpreadsheet className='w-4 h-4' />
                  <span className='hidden sm:inline'>CSV</span>
                </CSVLink>
                <Button onClick={downloadPDF} className='h-10 bg-red-600 hover:bg-red-500 gap-2 text-sm'>
                  <FileText className='w-4 h-4'/>
                  <span className='hidden sm:inline'>PDF</span>
                </Button>
              </div>
            </div>
 
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
              <StatBox label='Total Students' value={String(data.summary.total_students)} />
              <StatBox label='Paid'    value={String(data.summary.paid_count)}    color='text-green-600' />
              <StatBox label='Unpaid'  value={String(data.summary.unpaid_count)}  color='text-red-600' />
              <StatBox label='Collected' value={`₹${data.summary.total_collected.toLocaleString('en-IN')}`} color='text-blue-600' />
            </div>
          </div>
 
          <div className='bg-white rounded-2xl border border-slate-200 p-6'>
            <div className='mb-4 pb-3 border-b border-slate-200'>
              <h3 className='font-bold text-slate-800 text-lg'>{data.hostel_name}</h3>
              <p className='text-slate-500 text-sm'>Payment Report Preview — {data.month}</p>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full text-xs border-collapse'>
                <thead>
                  <tr className='bg-slate-100'>
                    {['Student','Room','Rent','Paid','Mode','Date','Status'].map(h => (
                      <th key={h} className='text-left px-2 py-2 text-slate-600 font-semibold border border-slate-200'>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50'}>
                      <td className='px-2 py-1.5 border border-slate-200 font-medium'>{row.student_name}</td>
                      <td className='px-2 py-1.5 border border-slate-200 text-center'>{row.room_number}</td>
                      <td className='px-2 py-1.5 border border-slate-200 text-right'>₹{row.rent_amount.toLocaleString('en-IN')}</td>
                      <td className='px-2 py-1.5 border border-slate-200 text-right'>{row.amount_paid > 0 ? `₹${row.amount_paid.toLocaleString('en-IN')}` : '—'}</td>
                      <td className='px-2 py-1.5 border border-slate-200 text-center'>{row.payment_mode}</td>
                      <td className='px-2 py-1.5 border border-slate-200'>{row.paid_date || '—'}</td>
                      <td className='px-2 py-1.5 border border-slate-200 text-center'>
                        <span className={`font-semibold ${row.status === 'Paid' ? 'text-green-600' : 'text-red-500'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
 
function StatBox({ label, value, color='text-slate-800' }: { label:string; value:string; color?:string }) {
  return (
    <div className='bg-slate-50 rounded-xl p-3 border border-slate-100'>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className='text-slate-400 text-xs mt-0.5'>{label}</p>
    </div>
  )
}