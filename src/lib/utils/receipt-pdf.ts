import jsPDF from 'jspdf'
import QRCode from 'qrcode'

export async function downloadPaymentReceiptPDF(
  hostelName: string,
  studentName: string,
  roomNumber: string,
  amountPaid: number,
  monthName: string,
  paymentMode: string,
  datePaid: string,
  receiptId: string,
  verifyUrl: string
) {
  const doc = new jsPDF()
  
  // Colors
  const primaryText = [15, 23, 42] as [number, number, number]
  const secondaryText = [100, 116, 139] as [number, number, number]
  
  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(primaryText[0], primaryText[1], primaryText[2])
  doc.text(hostelName, 105, 30, { align: 'center' })
  
  doc.setFontSize(14)
  doc.text('RENT RECEIPT', 105, 42, { align: 'center' })
  
  // Box
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(1)
  doc.roundedRect(20, 50, 170, 100, 5, 5)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  
  // Student info
  doc.text(`Student Name:`, 30, 65)
  doc.setFont('helvetica', 'bold')
  doc.text(studentName, 75, 65)
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Room Number:`, 30, 75)
  doc.setFont('helvetica', 'bold')
  doc.text(roomNumber, 75, 75)
  
  // Divider
  doc.setDrawColor(241, 245, 249)
  doc.line(30, 85, 180, 85)
  
  // Payment info
  doc.setFont('helvetica', 'normal')
  doc.text(`Amount Paid:`, 30, 95)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(16, 185, 129) // Green
  doc.text(`Rs. ${amountPaid.toLocaleString('en-IN')}`, 75, 95)
  
  doc.setFontSize(12)
  doc.setTextColor(primaryText[0], primaryText[1], primaryText[2])
  
  doc.setFont('helvetica', 'normal')
  doc.text(`For Month:`, 30, 105)
  doc.setFont('helvetica', 'bold')
  doc.text(monthName, 75, 105)
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Paid Via:`, 30, 115)
  doc.setFont('helvetica', 'bold')
  doc.text(paymentMode.toUpperCase(), 75, 115)
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Date & Time:`, 30, 125)
  doc.setFont('helvetica', 'bold')
  doc.text(datePaid, 75, 125)
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Receipt ID:`, 30, 135)
  doc.setFont('helvetica', 'bold')
  doc.text(receiptId, 75, 135)
  
  // QR Code
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 60, margin: 1 })
    doc.addImage(qrDataUrl, 'PNG', 120, 65, 55, 55)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2])
    doc.text('Scan to verify receipt', 147, 125, { align: 'center' })
  } catch (err) {
    console.error('QR error', err)
  }
  
  doc.setFontSize(10)
  doc.text('Generated securely by HostelPay Hub', 105, 160, { align: 'center' })
  
  doc.save(`Receipt_${studentName.replace(/\\s+/g, '_')}_${monthName.replace(/\\s+/g, '_')}.pdf`)
}
