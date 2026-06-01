// ══════════════════════════════════════════════════════════════════════════
// HOSTELPAY HUB — Due Date Calculation Utility
// This is the core business logic of the entire application.
// All payment engine API routes import and use these functions.
//
// Key concept: each student has a monthly_due_day (1-28).
// We determine the 'current cycle start date' and check if a
// payment exists after that date to know if they're paid.
// ══════════════════════════════════════════════════════════════════════════
 
import type { Payment } from '@/types'
 
// ── Get the current cycle's due date for a student ────────────────────────
// Returns the Date object representing when rent was last due.
// Examples:
//   today=14 June, due_day=12 → returns 12 June (due date was this month)
//   today=8  June, due_day=12 → returns 12 May  (due date was last month)
export function getCurrentCycleDueDate(dueDay: number, referenceDate: Date = new Date()): Date {
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
 
  const currentMonth = today.getMonth()
  const currentYear  = today.getFullYear()
  const todayDay     = today.getDate()
 
  if (todayDay >= dueDay) {
    // Due date already passed or is today this month
    return new Date(currentYear, currentMonth, dueDay)
  } else {
    // Due date hasn't arrived yet this month — use last month's due date
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastYear  = currentMonth === 0 ? currentYear - 1 : currentYear
    return new Date(lastYear, lastMonth, dueDay)
  }
}
 
// ── Check if a student has paid in the current cycle ─────────────────────
// 'payments' is the array of ALL payments for this student.
// Returns true if any payment's paid_at is on or after the cycle start date.
export function hasPaidThisCycle(
  dueDay: number,
  payments: Payment[],
  referenceDate: Date = new Date()
): boolean {
  if (!payments || payments.length === 0) return false
  const cycleStart = getCurrentCycleDueDate(dueDay, referenceDate)
  return payments.some(p => new Date(p.paid_at) >= cycleStart)
}
 
// ── Is this student due today? ────────────────────────────────────────────
// Returns true if their monthly_due_day equals today's date number.
export function isDueToday(dueDay: number, referenceDate: Date = new Date()): boolean {
  return dueDay === referenceDate.getDate()
}
 
// ── Is this student overdue? ──────────────────────────────────────────────
// Returns true if their due date was 3+ days ago and they haven't paid.
// Threshold is 3 days to avoid showing same-day or 1-2 day grace period students.
export function isOverdue(
  dueDay: number,
  payments: Payment[],
  overdueThresholdDays: number = 3,
  referenceDate: Date = new Date()
): boolean {
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
  
  const cycleStart = getCurrentCycleDueDate(dueDay, referenceDate)
  cycleStart.setHours(0, 0, 0, 0)
  
  const daysPastDue = Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24))
  
  // Not overdue if within grace period (or if cycleStart is in the future, which is daysPastDue < 0)
  if (daysPastDue < overdueThresholdDays) return false
 
  // Overdue only if they haven't paid this cycle
  return !hasPaidThisCycle(dueDay, payments, referenceDate)
}
 
// ── Get days past due (for overdue display) ───────────────────────────────
export function getDaysPastDue(dueDay: number, referenceDate: Date = new Date()): number {
  const todayDay = referenceDate.getDate()
  if (todayDay <= dueDay) return 0
  return todayDay - dueDay
}
 
// ── Get next due date (for 'upcoming' display) ────────────────────────────
export function getNextDueDate(dueDay: number, referenceDate: Date = new Date()): Date {
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

// ── Calculate total unpaid months ─────────────────────────────────────────
export function calculateMonthsUnpaid(
  dueDay: number,
  joinDateString: string,
  payments: Payment[],
  referenceDate: Date = new Date()
): number {
  let totalCycles = 0
  const joinDate = new Date(joinDateString)
  joinDate.setHours(0, 0, 0, 0)
  
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < 12; i++) {
    const checkDate = new Date(today)
    checkDate.setMonth(checkDate.getMonth() - i)
    checkDate.setHours(0, 0, 0, 0)
    
    const cycleDue = getCurrentCycleDueDate(dueDay, checkDate)
    cycleDue.setHours(0, 0, 0, 0)
    
    if (cycleDue > today) continue
    
    // 15 days leniency for early joiners to not be charged for a cycle they barely touched
    const joinLeniency = new Date(joinDate)
    joinLeniency.setDate(joinLeniency.getDate() - 15)
    if (cycleDue < joinLeniency) break
    
    totalCycles++
  }

  return Math.max(0, totalCycles - payments.length)
}
 
// ── Classify a student's payment status ──────────────────────────────────
export type PaymentStatus = 'overdue' | 'due_today' | 'paid' | 'upcoming'
 
export function getPaymentStatus(
  dueDay: number,
  payments: Payment[],
  referenceDate: Date = new Date(),
  joinDateString?: string
): PaymentStatus {
  let baseStatus: PaymentStatus = 'upcoming'
  if (hasPaidThisCycle(dueDay, payments, referenceDate)) baseStatus = 'paid'
  else if (isOverdue(dueDay, payments, 3, referenceDate)) baseStatus = 'overdue'
  else if (isDueToday(dueDay, referenceDate)) baseStatus = 'due_today'

  if (joinDateString) {
    const monthsUnpaid = calculateMonthsUnpaid(dueDay, joinDateString, payments, referenceDate)
    // If they owe for past cycles, force overdue
    if ((monthsUnpaid > 1) || (monthsUnpaid === 1 && baseStatus === 'paid')) {
      return 'overdue'
    }
  }
  
  return baseStatus
}