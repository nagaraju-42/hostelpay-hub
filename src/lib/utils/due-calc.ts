import type { Payment, ManualCharge } from '@/types'
 
export function getTodayIST(): Date {
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const istOffset = 5.5 * 60 * 60 * 1000
  return new Date(utc + istOffset)
}
 
export function getCurrentCycleDueDate(dueDay: number, referenceDate: Date = getTodayIST()): Date {
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
 
  const currentMonth = today.getMonth()
  const currentYear  = today.getFullYear()
  const todayDay     = today.getDate()
 
  if (todayDay >= dueDay) {
    return new Date(currentYear, currentMonth, dueDay)
  } else {
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastYear  = currentMonth === 0 ? currentYear - 1 : currentYear
    return new Date(lastYear, lastMonth, dueDay)
  }
}
 
export function isDueToday(dueDay: number, referenceDate: Date = getTodayIST()): boolean {
  return dueDay === referenceDate.getDate()
}
 
export function getDaysPastDue(dueDay: number, referenceDate: Date = getTodayIST()): number {
  const todayDay = referenceDate.getDate()
  if (todayDay <= dueDay) return 0
  return todayDay - dueDay
}
 
export function getNextDueDate(dueDay: number, referenceDate: Date = getTodayIST()): Date {
  const today        = new Date(referenceDate)
  const currentMonth = today.getMonth()
  const currentYear  = today.getFullYear()
  const todayDay     = today.getDate()
 
  if (todayDay <= dueDay) {
    return new Date(currentYear, currentMonth, dueDay)
  } else {
    const nextMonth = (currentMonth + 1) % 12
    const nextYear  = currentMonth === 11 ? currentYear + 1 : currentYear
    return new Date(nextYear, nextMonth, dueDay)
  }
}
 
export interface Ledger {
  totalBilled: number
  totalPaid: number
  totalOwed: number
  monthsUnpaid: number
  isAdvance: boolean
}

export interface PendingMonth {
  cycleDue: Date
  monthName: string
  billedAmount: number
  amountOwed: number
}
 
export function calculateLedger(
  studentRent: number,
  dueDay: number,
  joinDateString: string,
  payments: Payment[],
  referenceDate: Date = getTodayIST(),
  leaveDateString?: string | null,
  manualCharges?: ManualCharge[]
): Ledger {
  const rent = Number(studentRent) || 0
  if (rent <= 0) return { totalBilled: 0, totalPaid: 0, totalOwed: 0, monthsUnpaid: 0, isAdvance: false }
 
  const joinDate = new Date(joinDateString)
  joinDate.setHours(0, 0, 0, 0)
  
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)

  const leaveDate = leaveDateString ? new Date(leaveDateString) : null
  if (leaveDate) leaveDate.setHours(0, 0, 0, 0)

  const endDate = leaveDate ? new Date(Math.min(today.getTime(), leaveDate.getTime())) : today
 
  let totalBilled = 0
  let lastCycleDue: Date | null = null
 
  for (let i = 0; i < 24; i++) {
    const checkDate = new Date(endDate)
    checkDate.setMonth(checkDate.getMonth() - i)
    checkDate.setHours(0, 0, 0, 0)
    
    const cycleDue = getCurrentCycleDueDate(dueDay, checkDate)
    cycleDue.setHours(0, 0, 0, 0)
    
    if (cycleDue > endDate) continue
    if (cycleDue < joinDate) break
 
    totalBilled += rent
    if (!lastCycleDue || cycleDue > lastCycleDue) {
      lastCycleDue = cycleDue
    }
  }

  // Grace Period Logic on Leaving
  if (leaveDate && lastCycleDue && leaveDate > lastCycleDue) {
    const msInDay = 1000 * 60 * 60 * 24
    const daysExtra = Math.floor((leaveDate.getTime() - lastCycleDue.getTime()) / msInDay)
    
    if (daysExtra > 5) {
      // Add prorated charge for extra days beyond grace period
      totalBilled += (daysExtra / 30) * rent
    }
  }

  // Add Manual Charges
  if (manualCharges) {
    totalBilled += manualCharges.reduce((sum, mc) => sum + Number(mc.amount), 0)
  }
 
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0)
 
  const balance = totalPaid - totalBilled
  const totalOwed = balance < 0 ? Math.abs(balance) : 0
  const isAdvance = balance > 0
  const monthsUnpaid = totalOwed > 0 ? (totalOwed / rent) : 0
 
  return {
    totalBilled: Math.round(totalBilled),
    totalPaid: Math.round(totalPaid),
    totalOwed: Math.round(totalOwed),
    monthsUnpaid,
    isAdvance
  }
}

export function getPendingMonths(
  studentRent: number,
  dueDay: number,
  joinDateString: string,
  payments: Payment[],
  referenceDate: Date = getTodayIST(),
  leaveDateString?: string | null,
  manualCharges?: ManualCharge[]
): PendingMonth[] {
  const rent = Number(studentRent) || 0
  if (rent <= 0) return []

  const joinDate = new Date(joinDateString)
  joinDate.setHours(0, 0, 0, 0)
  
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)

  const leaveDate = leaveDateString ? new Date(leaveDateString) : null
  if (leaveDate) leaveDate.setHours(0, 0, 0, 0)
  const endDate = leaveDate ? new Date(Math.min(today.getTime(), leaveDate.getTime())) : today

  let cycles: { cycleDue: Date; billedAmount: number; desc: string }[] = []
  let lastCycleDue: Date | null = null

  for (let i = 0; i < 24; i++) {
    const checkDate = new Date(endDate)
    checkDate.setMonth(checkDate.getMonth() - i)
    checkDate.setHours(0, 0, 0, 0)
    
    const cycleDue = getCurrentCycleDueDate(dueDay, checkDate)
    cycleDue.setHours(0, 0, 0, 0)
    
    if (cycleDue > endDate) continue
    if (cycleDue < joinDate) break

    const monthName = cycleDue.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    cycles.push({ cycleDue, billedAmount: rent, desc: `Rent Assessed (${monthName})` })

    if (!lastCycleDue || cycleDue > lastCycleDue) {
      lastCycleDue = cycleDue
    }
  }

  cycles.reverse()

  // Grace Period Logic on Leaving
  if (leaveDate && lastCycleDue && leaveDate > lastCycleDue) {
    const msInDay = 1000 * 60 * 60 * 24
    const daysExtra = Math.floor((leaveDate.getTime() - lastCycleDue.getTime()) / msInDay)
    
    if (daysExtra > 5) {
      const extraCharge = Math.round((daysExtra / 30) * rent)
      cycles.push({
        cycleDue: leaveDate,
        billedAmount: extraCharge,
        desc: `Prorated Checkout Charge (${daysExtra} extra days)`
      })
    }
  }

  // Add Manual Charges
  if (manualCharges) {
    for (const mc of manualCharges) {
      cycles.push({
        cycleDue: new Date(mc.date),
        billedAmount: Number(mc.amount),
        desc: mc.description
      })
    }
    // Re-sort chronological after adding manual charges
    cycles.sort((a, b) => a.cycleDue.getTime() - b.cycleDue.getTime())
  }

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0)
  let remainingPaid = totalPaid
  const pendingMonths: PendingMonth[] = []

  for (const cycle of cycles) {
    // If it's a discount (negative billedAmount), it reduces remaining needed
    if (cycle.billedAmount < 0) {
      remainingPaid -= cycle.billedAmount // subtracting a negative adds to remaining paid capacity
      continue
    }

    if (remainingPaid >= cycle.billedAmount) {
      remainingPaid -= cycle.billedAmount
    } else {
      const amountOwed = cycle.billedAmount - remainingPaid
      remainingPaid = 0
      
      pendingMonths.push({
        cycleDue: cycle.cycleDue,
        monthName: cycle.desc.includes('Rent Assessed') ? cycle.desc.replace('Rent Assessed (', '').replace(')', '') : cycle.desc,
        billedAmount: cycle.billedAmount,
        amountOwed: Math.round(amountOwed)
      })
    }
  }

  return pendingMonths
}
 
export type PaymentStatus = 'overdue' | 'due_today' | 'paid' | 'upcoming'
 
export function getPaymentStatus(
  studentRent: number,
  dueDay: number,
  joinDateString: string,
  payments: Payment[],
  referenceDate: Date = getTodayIST(),
  leaveDateString?: string | null,
  manualCharges?: ManualCharge[]
): PaymentStatus {
  const ledger = calculateLedger(studentRent, dueDay, joinDateString, payments, referenceDate, leaveDateString, manualCharges)
 
  if (ledger.totalOwed > 0) {
    const cycleStart = getCurrentCycleDueDate(dueDay, referenceDate)
    const today = new Date(referenceDate)
    const daysPastDue = Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24))
 
    if (ledger.totalOwed > studentRent) {
      return 'overdue'
    }
 
    if (daysPastDue >= 3) {
      return 'overdue'
    } else if (isDueToday(dueDay, referenceDate)) {
      return 'due_today'
    } else {
      return 'upcoming'
    }
  }
 
  return 'paid'
}

export interface LedgerTransaction {
  date: string
  particulars: string
  charges: number | null
  payments: number | null
  balance: number
}

export function generateStudentLedger(
  studentRent: number,
  dueDay: number,
  joinDateString: string,
  payments: Payment[],
  referenceDate: Date = getTodayIST(),
  leaveDateString?: string | null,
  manualCharges?: ManualCharge[]
): LedgerTransaction[] {
  const rent = Number(studentRent) || 0
  if (rent <= 0) return []

  const joinDate = new Date(joinDateString)
  joinDate.setHours(0, 0, 0, 0)
  
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)

  const leaveDate = leaveDateString ? new Date(leaveDateString) : null
  if (leaveDate) leaveDate.setHours(0, 0, 0, 0)
  const endDate = leaveDate ? new Date(Math.min(today.getTime(), leaveDate.getTime())) : today

  let billedEvents: { date: Date, amount: number, desc: string }[] = []
  let lastCycleDue: Date | null = null

  for (let i = 0; i < 24; i++) {
    const checkDate = new Date(endDate)
    checkDate.setMonth(checkDate.getMonth() - i)
    checkDate.setHours(0, 0, 0, 0)
    
    const cycleDue = getCurrentCycleDueDate(dueDay, checkDate)
    cycleDue.setHours(0, 0, 0, 0)
    
    if (cycleDue > endDate) continue
    if (cycleDue < joinDate) break

    const monthName = cycleDue.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    billedEvents.push({ 
      date: cycleDue, 
      amount: rent,
      desc: `Rent Assessed (${monthName})`
    })

    if (!lastCycleDue || cycleDue > lastCycleDue) {
      lastCycleDue = cycleDue
    }
  }

  if (leaveDate && lastCycleDue && leaveDate > lastCycleDue) {
    const msInDay = 1000 * 60 * 60 * 24
    const daysExtra = Math.floor((leaveDate.getTime() - lastCycleDue.getTime()) / msInDay)
    
    if (daysExtra > 5) {
      const extraCharge = Math.round((daysExtra / 30) * rent)
      billedEvents.push({
        date: leaveDate,
        amount: extraCharge,
        desc: `Prorated Checkout Charge (${daysExtra} extra days)`
      })
    }
  }

  if (manualCharges) {
    for (const mc of manualCharges) {
      billedEvents.push({
        date: new Date(mc.date),
        amount: Number(mc.amount),
        desc: mc.description
      })
    }
  }

  const paymentEvents = payments.map(p => ({
    date: new Date(p.paid_at),
    amount: Number(p.amount_paid || 0),
    desc: `Payment Received (${p.payment_mode === 'upi' ? 'UPI' : p.payment_mode === 'cash' ? 'Cash' : 'Bank'})`
  }))

  const allEvents = [
    ...billedEvents.map(e => ({ ...e, type: 'charge' as const })),
    ...paymentEvents.map(e => ({ ...e, type: 'payment' as const }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  let runningBalance = 0
  const ledger: LedgerTransaction[] = [
    {
      date: joinDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      particulars: 'Opening Balance',
      charges: null,
      payments: null,
      balance: 0
    }
  ]

  for (const event of allEvents) {
    if (event.type === 'charge') {
      runningBalance += event.amount
      ledger.push({
        date: event.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        particulars: event.desc,
        charges: event.amount,
        payments: null,
        balance: Math.round(runningBalance)
      })
    } else {
      runningBalance -= event.amount
      ledger.push({
        date: event.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        particulars: event.desc,
        charges: null,
        payments: event.amount,
        balance: Math.round(runningBalance)
      })
    }
  }

  return ledger
}