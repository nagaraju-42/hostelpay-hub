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
 
  function downloadPDF() {
    if (!data) return
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.setTextColor(30, 41, 59)
    doc.text(`${data.hostel_name} - Payment Report`, 14, 22)
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Month: ${data.month}   |   Generated: ${data.generated_at}`, 14, 30)
    doc.setTextColor(15, 23, 42)
    doc.text(`Total Students: ${data.summary.total_students}   |   Paid: ${data.summary.paid_count}   |   Unpaid: ${data.summary.unpaid_count}`, 14, 38)
    doc.text(`Total Collected: Rs. ${data.summary.total_collected.toLocaleString('en-IN')}`, 14, 44)
 
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
 
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235] },
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
 
  const fileName = data ? `${data.hostel_name}-${data.month}.csv` : 'export.csv'
 
  return (
    <div className='space-y-6 max-w-4xl mx-auto pb-10'>
      {/* Full screen loader overlay */}
      {loading && (
        <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Generating Report...</p>
          </div>
        </div>
      )}
 
      <div className='px-1 sm:px-0'>
        <h1 className='text-xl sm:text-2xl font-bold text-slate-800'>Export Reports</h1>
        <p className='text-slate-500 text-xs sm:text-sm mt-1'>Download monthly payment reports as CSV or PDF.</p>
      </div>
 
      {/* Controls Container */}
      <div className='bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm'>
        <div className='flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4'>
          <div className='space-y-1.5 flex-1 min-w-[160px]'>
            <label className='text-xs sm:text-sm font-medium text-slate-700'>Select Month</label>
            <input type='month' value={month} onChange={e => setMonth(e.target.value)}
              max={currentMonth}
              className='w-full h-11 rounded-lg border border-slate-200 px-3 text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-shadow' />
          </div>
          <Button onClick={fetchExportData} disabled={loading}
            className='h-11 w-full sm:w-auto bg-blue-600 hover:bg-blue-500 gap-2 shadow-sm'>
            Load Report
          </Button>
        </div>
      </div>
 
      {error && (
        <div className='flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-red-600 text-sm'>
          <AlertCircle className='w-4 h-4 flex-shrink-0' />{error}
        </div>
      )}
 
      {data && (
        <div className='space-y-4'>
          {/* Summary Box */}
          <div className='bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5'>
              <div>
                <h2 className='font-semibold text-slate-800 text-base sm:text-lg truncate'>{data.hostel_name}</h2>
                <p className='text-slate-500 text-sm'>{data.month}</p>
                <p className='text-slate-400 text-xs mt-0.5'>Generated: {data.generated_at}</p>
              </div>
              <div className='flex gap-2 w-full sm:w-auto'>
                <CSVLink
                  data={data.rows} headers={csvHeaders} filename={fileName}
                  className='flex-1 sm:flex-none inline-flex justify-center items-center gap-2 h-10 px-4 rounded-lg bg-green-600
                             hover:bg-green-500 text-white text-sm font-medium transition-colors shadow-sm'>
                  <FileSpreadsheet className='w-4 h-4' />
                  CSV
                </CSVLink>
                <Button onClick={downloadPDF} className='flex-1 sm:flex-none h-10 bg-red-600 hover:bg-red-500 gap-2 text-sm shadow-sm'>
                  <FileText className='w-4 h-4'/>
                  PDF
                </Button>
              </div>
            </div>
 
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3'>
              <StatBox label='Total Students' value={String(data.summary.total_students)} />
              <StatBox label='Paid'    value={String(data.summary.paid_count)}    color='text-green-600' />
              <StatBox label='Unpaid'  value={String(data.summary.unpaid_count)}  color='text-red-600' />
              <StatBox label='Collected' value={`₹${data.summary.total_collected.toLocaleString('en-IN')}`} color='text-blue-600' />
            </div>
          </div>
 
          {/* Printable Report Preview */}
          <div className='bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm'>
            <div className='p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50'>
              <h3 className='font-bold text-slate-800 text-base sm:text-lg truncate'>{data.hostel_name}</h3>
              <p className='text-slate-500 text-sm'>Payment Report Preview — {data.month}</p>
            </div>
            <div className='overflow-x-auto w-full'>
              <table className='w-full text-xs sm:text-sm border-collapse min-w-[600px]'>
                <thead>
                  <tr className='bg-slate-100/80'>
                    {['Student','Room','Rent','Paid','Mode','Date','Status'].map(h => (
                      <th key={h} className='text-left px-3 sm:px-4 py-3 text-slate-600 font-semibold border-b border-slate-200'>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => (
                    <tr key={i} className={`hover:bg-slate-50 transition-colors ${i !== data.rows.length - 1 ? 'border-b border-slate-100' : ''}`}>
                      <td className='px-3 sm:px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap'>{row.student_name}</td>
                      <td className='px-3 sm:px-4 py-2.5 text-center text-slate-600'>{row.room_number}</td>
                      <td className='px-3 sm:px-4 py-2.5 text-right text-slate-600 whitespace-nowrap'>₹{row.rent_amount.toLocaleString('en-IN')}</td>
                      <td className='px-3 sm:px-4 py-2.5 text-right font-medium whitespace-nowrap'>{row.amount_paid > 0 ? `₹${row.amount_paid.toLocaleString('en-IN')}` : '—'}</td>
                      <td className='px-3 sm:px-4 py-2.5 text-center text-slate-500 text-xs'>{row.payment_mode}</td>
                      <td className='px-3 sm:px-4 py-2.5 text-slate-500 whitespace-nowrap'>{row.paid_date || '—'}</td>
                      <td className='px-3 sm:px-4 py-2.5 text-center'>
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] sm:text-xs font-semibold ${row.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
    <div className='bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100 transition-colors hover:bg-slate-100'>
      <p className={`text-lg sm:text-xl font-bold truncate ${color}`}>{value}</p>
      <p className='text-slate-500 text-[10px] sm:text-xs mt-0.5 truncate uppercase tracking-wide font-medium'>{label}</p>
    </div>
  )
}