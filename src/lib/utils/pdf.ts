import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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

  // Define colors
  const primaryText = [15, 23, 42] as [number, number, number] // Slate 900
  const secondaryText = [100, 116, 139] as [number, number, number] // Slate 500
  const emerald = [16, 185, 129] as [number, number, number]
  const rose = [225, 29, 72] as [number, number, number]

  // Generate Unique Statement ID (e.g. STMT-20260602-A8F9)
  const now = new Date()
  const dateStr = now.getFullYear().toString() + 
                  (now.getMonth() + 1).toString().padStart(2, '0') + 
                  now.getDate().toString().padStart(2, '0')
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
  const statementId = `STMT-${dateStr}-${randomStr}`

  // Generate QR Code for live verification
  let qrDataUrl = ''
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hostelpay.com'
    const verifyUrl = `${baseUrl}/verify/${studentId}`
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 70,
      margin: 0,
      color: { dark: primaryText.map(x => x.toString(16).padStart(2, '0')).join(''), light: '#FFFFFF' }
    })
  } catch (err) {
    console.error('Failed to generate QR:', err)
  }

  // Top Header Area
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(primaryText[0], primaryText[1], primaryText[2])
  doc.text(hostelName, 14, 25)

  if (qrDataUrl) {
    // Top-right corner
    doc.addImage(qrDataUrl, 'PNG', 176, 12, 20, 20)
    
    // Move "STATEMENT OF ACCOUNT" and details slightly left
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2])
    doc.text('STATEMENT OF ACCOUNT', 170, 18, { align: 'right' })
    
    doc.setFontSize(9)
    doc.text(`Statement ID: ${statementId}`, 170, 23, { align: 'right' })
    doc.text(`Generated: ${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN')}`, 170, 28, { align: 'right' })
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2])
    doc.text('STATEMENT OF ACCOUNT', 196, 18, { align: 'right' })
    
    doc.setFontSize(9)
    doc.text(`Statement ID: ${statementId}`, 196, 23, { align: 'right' })
    doc.text(`Generated: ${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN')}`, 196, 28, { align: 'right' })
  }

  // Divider Line
  doc.setDrawColor(226, 232, 240) // Slate 200
  doc.setLineWidth(0.5)
  doc.line(14, 34, 196, 34)

  // Student Details (Left side)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(primaryText[0], primaryText[1], primaryText[2])
  doc.text(studentName, 14, 44)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2])
  doc.text(`Room: ${roomNumber}`, 14, 50)
  doc.text(`Joined: ${new Date(joinDateString).toLocaleDateString('en-IN')}`, 14, 55)
  doc.text(`Monthly Rent: Rs. ${rentAmount.toLocaleString('en-IN')} (${billingType === 'postpaid' ? 'Postpaid' : 'Prepaid'})`, 14, 60)

  // Balance Summary (Right side box)
  const finalBalanceRow = ledger[ledger.length - 1]
  const finalBalance = finalBalanceRow ? finalBalanceRow.balance : 0
  let statusText = ''
  let statusVal = ''
  let statusColor = secondaryText

  if (finalBalance === 0) {
    statusText = 'Account Settled'
    statusVal = 'Rs. 0'
    statusColor = emerald
  } else if (finalBalance > 0) {
    statusText = 'Amount Due'
    statusVal = `Rs. ${finalBalance.toLocaleString('en-IN')}`
    statusColor = rose
  } else {
    statusText = 'Paid in Advance'
    statusVal = `Rs. ${Math.abs(finalBalance).toLocaleString('en-IN')}`
    statusColor = emerald
  }

  // Draw Summary Box
  doc.setFillColor(248, 250, 252) // Slate 50
  doc.setDrawColor(226, 232, 240) // Slate 200
  doc.roundedRect(120, 40, 76, 24, 3, 3, 'FD')

  doc.setFontSize(10)
  doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2])
  doc.text('Current Balance', 125, 48)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
  doc.text(statusVal, 190, 58, { align: 'right' })

  if (finalBalance !== 0) {
    doc.setFontSize(9)
    doc.text(statusText, 125, 58)
  }

  // Ledger Table
  autoTable(doc, {
    head: [['Date', 'Description', 'Charges', 'Payments', 'Balance']],
    body: ledger.map(row => {
      let balStr = `Rs. ${Math.abs(row.balance).toLocaleString('en-IN')}`
      if (row.balance > 0) balStr += ' (Due)'
      else if (row.balance < 0) balStr += ' (Adv)'
      
      return [
        row.date,
        row.particulars,
        row.charges !== null ? `Rs. ${row.charges.toLocaleString('en-IN')}` : '',
        row.payments !== null ? `Rs. ${row.payments.toLocaleString('en-IN')}` : '',
        balStr
      ]
    }),
    startY: 74,
    styles: { 
      fontSize: 9, 
      cellPadding: 6,
      font: 'helvetica',
      textColor: [51, 65, 85]
    },
    headStyles: { 
      fillColor: [241, 245, 249], 
      textColor: [71, 85, 105], 
      fontStyle: 'bold',
      lineColor: [226, 232, 240],
      lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 }
    },
    bodyStyles: {
      lineColor: [241, 245, 249],
      lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 }
    },
    alternateRowStyles: { 
      fillColor: [255, 255, 255] 
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 'auto' },
      2: { halign: 'right', textColor: rose },
      3: { halign: 'right', textColor: emerald },
      4: { halign: 'right', fontStyle: 'bold', textColor: primaryText }
    },
    margin: { left: 14, right: 14 }
  })

  // Footer (Pagination)
  const pageCount = (doc as any).internal.getNumberOfPages()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Page ${i} of ${pageCount}`, 
      doc.internal.pageSize.getWidth() / 2, 
      doc.internal.pageSize.getHeight() - 10, 
      { align: 'center' }
    )
    
    // Bottom left footer security note
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(`Ref: ${statementId} — generated securely by HostelPay Hub`, 14, doc.internal.pageSize.getHeight() - 10)
  }

  doc.save(`${studentName.replace(/\s+/g, '_')}_Statement.pdf`)
}
