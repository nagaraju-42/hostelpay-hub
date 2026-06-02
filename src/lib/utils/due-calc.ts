// ══════════════════════════════════════════════════════════════════════════
// HOSTELPAY HUB — Due Date Calculation Utility
// ══════════════════════════════════════════════════════════════════════════
 
import type { Payment } from '@/types'
 
// ── Timezone Helpers ──────────────────────────────────────────────────────
export function getTodayIST(): Date {
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const istOffset = 5.5 * 60 * 60 * 1000
  return new Date(utc + istOffset)
}
 
// ── Get the current cycle's due date for a student ────────────────────────
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
 
// ── Is this student due today? ────────────────────────────────────────────
export function isDueToday(dueDay: number, referenceDate: Date = getTodayIST()): boolean {
  return dueDay === referenceDate.getDate()
}
 
// ── Get days past due ─────────────────────────────────────────────────────
export function getDaysPastDue(dueDay: number, referenceDate: Date = getTodayIST()): number {
  const todayDay = referenceDate.getDate()
  if (todayDay <= dueDay) return 0
  return todayDay - dueDay
}
 
// ── Get next due date (for 'upcoming' display) ────────────────────────────
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
 
// ── Calculate Ledger Balance ──────────────────────────────────────────────
export interface Ledger {
  totalBilled: number
  totalPaid: number
  totalOwed: number
  monthsUnpaid: number
  isAdvance: boolean
}
 
export function calculateLedger(
  studentRent: number,
  dueDay: number,
  joinDateString: string,
  payments: Payment[],
  referenceDate: Date = getTodayIST()
): Ledger {
  const rent = Number(studentRent) || 0
  if (rent <= 0) return { totalBilled: 0, totalPaid: 0, totalOwed: 0, monthsUnpaid: 0, isAdvance: false }
 
  const joinDate = new Date(joinDateString)
  joinDate.setHours(0, 0, 0, 0)
  
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
 
  let totalBilled = 0
 
  // We loop backward up to 24 cycles to calculate exactly how many times the due date has passed
  for (let i = 0; i < 24; i++) {
    const checkDate = new Date(today)
    checkDate.setMonth(checkDate.getMonth() - i)
    checkDate.setHours(0, 0, 0, 0)
    
    const cycleDue = getCurrentCycleDueDate(dueDay, checkDate)
    cycleDue.setHours(0, 0, 0, 0)
    
    if (cycleDue > today) continue
    if (cycleDue < joinDate) break
 
    // First cycle mathematical prorating
    const prevCycle = new Date(cycleDue)
    prevCycle.setMonth(prevCycle.getMonth() - 1)
    
    if (prevCycle < joinDate) {
      // This is the first cycle. Prorate it.
      const msInDay = 1000 * 60 * 60 * 24
      const daysStayed = Math.floor((cycleDue.getTime() - joinDate.getTime()) / msInDay) + 1
      
      if (daysStayed > 0 && daysStayed <= 30) {
        totalBilled += (daysStayed / 30) * rent
      } else if (daysStayed > 30) {
        totalBilled += rent 
      }
    } else {
      totalBilled += rent
    }
  }
 
  // Calculate total paid
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0)
 
  const balance = totalPaid - totalBilled
  const totalOwed = balance < 0 ? Math.abs(balance) : 0
  const isAdvance = balance > 0
  const monthsUnpaid = totalOwed > 0 ? Math.ceil(totalOwed / rent) : 0
 
  return {
    totalBilled: Math.round(totalBilled),
    totalPaid: Math.round(totalPaid),
    totalOwed: Math.round(totalOwed),
    monthsUnpaid,
    isAdvance
  }
}
 
// ── Classify a student's payment status ──────────────────────────────────
export type PaymentStatus = 'overdue' | 'due_today' | 'paid' | 'upcoming'
 
export function getPaymentStatus(
  studentRent: number,
  dueDay: number,
  joinDateString: string,
  payments: Payment[],
  referenceDate: Date = getTodayIST()
): PaymentStatus {
  // Check if they owe anything based on the ledger
  const ledger = calculateLedger(studentRent, dueDay, joinDateString, payments, referenceDate)
 
  if (ledger.totalOwed > 0) {
    const cycleStart = getCurrentCycleDueDate(dueDay, referenceDate)
    const today = new Date(referenceDate)
    const daysPastDue = Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24))
 
    // If they owe for PAST cycles, force overdue regardless of grace period
    if (ledger.totalOwed > studentRent) {
      return 'overdue'
    }
 
    // They only owe for the current cycle. Are they in the grace period?
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