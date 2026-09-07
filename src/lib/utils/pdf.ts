import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import type { LedgerTransaction } from './due-calc'

export async function downloadStudentLedgerPDF(
  studentId: string,
  hostelName: string,
  studentName: string,
  roomNumber: string,
  joinDateString: string,
  rentAmount: number,
  ledger: LedgerTransaction[],
  billingType: string = 'prepaid'
) {
  const doc = new jsPDF()

  // Colors
  const primaryText = [15, 23, 42] as [number, number, number]
  const secondaryText = [100, 116, 139] as [number, number, number]
  const emerald = [16, 185, 129] as [number, number, number]
  const rose = [225, 29, 72] as [number, number, number]

  const statementId = `STMT-${Date.now().toString().slice(-6)}`

  // Generate QR Code
  let qrDataUrl = ''
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hostelpay.com'
    const verifyUrl = `${baseUrl}/verify/${studentId}`
    qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 50, margin: 0 })
  } catch (err) {}

  // Header Box
  doc.setDrawColor(primaryText[0], primaryText[1], primaryText[2])
  doc.setLineWidth(0.5)
  doc.rect(14, 15, 182, 30)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(primaryText[0], primaryText[1], primaryText[2])
  doc.text(hostelName, 105, 25, { align: 'center' })
  doc.setFontSize(14)
  doc.text('RENT STATEMENT', 105, 35, { align: 'center' })

  // Student Info Box
  doc.rect(14, 45, 182, 25)
  doc.setFontSize(11)
  doc.text(`Student: ${studentName}`, 18, 52)
  doc.setFont('helvetica', 'normal')
  doc.text(`Room: ${roomNumber}`, 18, 59)
  doc.text(`Monthly Rent: Rs. ${rentAmount.toLocaleString('en-IN')}`, 18, 66)

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', 170, 48, 20, 20)
  }

  // Payment Summary
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('PAYMENT SUMMARY', 14, 85)
  doc.line(14, 88, 196, 88)

  let y = 95
  doc.setFontSize(11)
  
  // Calculate totals
  let totalPaid = 0
  let totalDue = 0

  // We loop through ledger and show rent assessments and payments nicely
  for (const row of ledger) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    
    if (row.particulars.includes('Rent Assessed') || row.charges !== null) {
      doc.setTextColor(rose[0], rose[1], rose[2])
      doc.text('❌', 14, y)
      doc.setTextColor(primaryText[0], primaryText[1], primaryText[2])
      doc.setFont('helvetica', 'bold')
      doc.text(row.particulars.replace('Rent Assessed (', '').replace(')', ''), 25, y)
      doc.text(`Rs. ${row.charges?.toLocaleString('en-IN')}`, 140, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2])
      doc.text('UNPAID', 175, y)
      totalDue += (row.charges || 0)
    } 
    else if (row.payments !== null) {
      doc.setTextColor(emerald[0], emerald[1], emerald[2])
      doc.text('✅', 14, y)
      doc.setTextColor(primaryText[0], primaryText[1], primaryText[2])
      doc.setFont('helvetica', 'normal')
      doc.text(row.particulars, 25, y)
      doc.setFont('helvetica', 'bold')
      doc.text(`Rs. ${row.payments.toLocaleString('en-IN')}`, 140, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(emerald[0], emerald[1], emerald[2])
      doc.text(`PAID on ${row.date}`, 175, y)
      totalPaid += row.payments
    } else {
      continue // Skip Opening Balance etc.
    }
    y += 10
  }

  // Final totals box
  y += 5
  doc.setDrawColor(226, 232, 240)
  doc.setFillColor(248, 250, 252)
  doc.rect(14, y, 182, 25, 'FD')
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(primaryText[0], primaryText[1], primaryText[2])
  doc.text(`Total Paid:`, 18, y + 10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Rs. ${totalPaid.toLocaleString('en-IN')}`, 60, y + 10)

  const finalBal = ledger[ledger.length - 1]?.balance || 0
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Pending:`, 18, y + 18)
  doc.setFont('helvetica', 'bold')
  if (finalBal > 0) {
    doc.setTextColor(rose[0], rose[1], rose[2])
    doc.text(`Rs. ${finalBal.toLocaleString('en-IN')}`, 60, y + 18)
  } else {
    doc.setTextColor(emerald[0], emerald[1], emerald[2])
    doc.text(`Rs. 0 (All clear)`, 60, y + 18)
  }

  // Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Ref: ${statementId} — generated securely by HostelPay Hub`, 105, 290, { align: 'center' })

  doc.save(`${studentName.replace(/\s+/g, '_')}_Statement.pdf`)
}
