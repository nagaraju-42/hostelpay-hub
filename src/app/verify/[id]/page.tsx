import { supabaseAdmin } from '@/lib/supabase/server'
import { calculateLedger, getTodayIST } from '@/lib/utils/due-calc'
import Link from 'next/link'
import { ShieldCheck, ShieldAlert } from 'lucide-react'

export default async function VerifyStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Fetch student, owner, payments, charges in parallel
  const [studentRes, paymentsRes, chargesRes] = await Promise.all([
    supabaseAdmin.from('students').select('*, hostel_owners(hostel_name)').eq('id', id).single(),
    supabaseAdmin.from('payments').select('*').eq('student_id', id),
    supabaseAdmin.from('manual_charges').select('*').eq('student_id', id)
  ])

  if (studentRes.error || !studentRes.data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FEF2F2', padding: 24, textAlign: 'center' }}>
        <ShieldAlert size={64} color="#991B1B" style={{ marginBottom: 16 }} />
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#991B1B', marginBottom: 8 }}>Invalid Statement</h1>
        <p style={{ color: '#7F1D1D' }}>This QR code does not match any valid student record in our system. It may be forged.</p>
      </div>
    )
  }

  const student = studentRes.data
  const payments = paymentsRes.data || []
  const manualCharges = chargesRes.data || []

  const ledger = calculateLedger(
    student.rent_amount,
    student.monthly_due_day,
    student.date_of_joining,
    payments,
    getTodayIST(),
    student.date_of_leaving,
    manualCharges,
    student.billing_type || 'prepaid'
  )

  const finalBalance = ledger.totalOwed > 0 ? ledger.totalOwed : (ledger.isAdvance ? -ledger.totalPaid + ledger.totalBilled : 0)

  let statusColor = '#64748B'
  let statusBg = '#F8FAFC'
  let statusText = ''
  let statusVal = ''

  if (finalBalance === 0) {
    statusText = 'Account Settled'
    statusVal = '₹0'
    statusColor = '#059669' // Emerald
    statusBg = '#ECFDF5'
  } else if (finalBalance > 0) {
    statusText = 'Amount Due'
    statusVal = `₹${finalBalance.toLocaleString('en-IN')}`
    statusColor = '#E11D48' // Rose
    statusBg = '#FFF1F2'
  } else {
    statusText = 'Paid in Advance'
    statusVal = `₹${Math.abs(finalBalance).toLocaleString('en-IN')}`
    statusColor = '#059669'
    statusBg = '#ECFDF5'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: 400, width: '100%', background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', marginTop: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <ShieldCheck size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F2744', marginBottom: 4 }}>Verified Statement</h1>
          <p style={{ color: '#64748B', fontSize: 14 }}>Live Data from HostelPay Hub</p>
        </div>

        <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Hostel</p>
          <p style={{ fontSize: 16, color: '#0F2744', fontWeight: 600, marginBottom: 16 }}>{student.hostel_owners?.hostel_name || 'Hostel'}</p>

          <p style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Student</p>
          <p style={{ fontSize: 16, color: '#0F2744', fontWeight: 600, marginBottom: 16 }}>{student.full_name} (Room {student.room_number})</p>

          <p style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Joined</p>
          <p style={{ fontSize: 16, color: '#0F2744', fontWeight: 600 }}>{new Date(student.date_of_joining).toLocaleDateString('en-IN')}</p>
        </div>

        <div style={{ background: statusBg, border: `2px solid ${statusColor}40`, borderRadius: 16, padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: statusColor, fontWeight: 700, marginBottom: 4 }}>{statusText}</p>
          <p style={{ fontSize: 36, color: statusColor, fontWeight: 800 }}>{statusVal}</p>
          <p style={{ fontSize: 12, color: statusColor, opacity: 0.8, marginTop: 8 }}>As of {new Date().toLocaleString('en-IN')}</p>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#94A3B8' }}>
            If this live balance does not match the printed statement, the printed statement is fake or outdated.
          </p>
        </div>
      </div>
    </div>
  )
}
