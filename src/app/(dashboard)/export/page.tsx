'use client'
 
import { useState, useRef } from 'react'
import { CSVLink } from 'react-csv'
import { FileSpreadsheet, FileText, Download, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ExportData } from '@/app/api/export/payments/route'
 
export default function ExportPage() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [month,       setMonth]       = useState(currentMonth)
  const [data,        setData]        = useState<ExportData | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [pdfLoading,  setPdfLoading]  = useState(false)
  const [error,       setError]       = useState('')
  const reportRef = useRef<HTMLDivElement>(null)
 
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
 
  async function downloadPDF() {
    if (!reportRef.current || !data) return
    setPdfLoading(true)
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF    = (await import('jspdf')).default
      const html2canvas = (await import('html2canvas')).default
 
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
 
      const imgWidth  = 210  // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
 
      const pdf = new jsPDF({ orientation: imgHeight > 297 ? 'p' : 'p', unit: 'mm', format: 'a4' })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`${data.hostel_name}-${data.month}-Report.pdf`)
    } catch(e) { console.error('PDF error:', e) }
    finally { setPdfLoading(false) }
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
 
      {/* Controls */}
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
 
      {/* Error */}
      {error && (
        <div className='flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm'>
          <AlertCircle className='w-4 h-4 flex-shrink-0' />{error}
        </div>
      )}
 
      {/* Report Preview + Download Buttons */}
      {data && (
        <div className='space-y-4'>
 
          {/* Summary */}
          <div className='bg-white rounded-2xl border border-slate-200 p-5'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h2 className='font-semibold text-slate-800'>{data.hostel_name} — {data.month}</h2>
                <p className='text-slate-400 text-xs mt-0.5'>Generated {data.generated_at}</p>
              </div>
              <div className='flex gap-2'>
                {/* CSV Download */}
                <CSVLink
                  data={data.rows} headers={csvHeaders} filename={fileName}
                  className='inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-green-600
                             hover:bg-green-500 text-white text-sm font-medium transition-colors'>
                  <FileSpreadsheet className='w-4 h-4' />
                  <span className='hidden sm:inline'>CSV</span>
                </CSVLink>
                {/* PDF Download */}
                <Button onClick={downloadPDF} disabled={pdfLoading}
                  className='h-10 bg-red-600 hover:bg-red-500 gap-2 text-sm'>
                  {pdfLoading
                    ? <><Loader2 className='w-4 h-4 animate-spin'/>...</>
                    : <><FileText className='w-4 h-4'/><span className='hidden sm:inline'>PDF</span></>
                  }
                </Button>
              </div>
            </div>
 
            {/* Stats */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
              <StatBox label='Total Students' value={String(data.summary.total_students)} />
              <StatBox label='Paid'    value={String(data.summary.paid_count)}    color='text-green-600' />
              <StatBox label='Unpaid'  value={String(data.summary.unpaid_count)}  color='text-red-600' />
              <StatBox label='Collected' value={`₹${data.summary.total_collected.toLocaleString('en-IN')}`} color='text-blue-600' />
            </div>
          </div>
 
          {/* Printable Report Table (used for PDF) */}
          <div ref={reportRef} className='bg-white rounded-2xl border border-slate-200 p-6'>
            <div className='mb-4 pb-3 border-b border-slate-200'>
              <h3 className='font-bold text-slate-800 text-lg'>{data.hostel_name}</h3>
              <p className='text-slate-500 text-sm'>Payment Report — {data.month}</p>
              <p className='text-slate-400 text-xs mt-1'>Generated: {data.generated_at}</p>
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
            <div className='mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between'>
              <span>Total Students: {data.summary.total_students}</span>
              <span>Paid: {data.summary.paid_count}  |  Unpaid: {data.summary.unpaid_count}</span>
              <span className='font-semibold text-slate-700'>Collected: ₹{data.summary.total_collected.toLocaleString('en-IN')}</span>
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