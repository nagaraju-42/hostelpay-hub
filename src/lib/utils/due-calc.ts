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
  const today    = new Date(referenceDate)
  const todayDay = today.getDate()
 
  // Not overdue if due date hasn't passed yet
  if (todayDay < dueDay) return false
 
  // Not overdue if within grace period
  const daysPastDue = todayDay - dueDay
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
 
// ── Classify a student's payment status ──────────────────────────────────
export type PaymentStatus = 'overdue' | 'due_today' | 'paid' | 'upcoming'
 
export function getPaymentStatus(
  dueDay: number,
  payments: Payment[],
  referenceDate: Date = new Date()
): PaymentStatus {
  if (hasPaidThisCycle(dueDay, payments, referenceDate)) return 'paid'
  if (isOverdue(dueDay, payments, 3, referenceDate))     return 'overdue'
  if (isDueToday(dueDay, referenceDate))                  return 'due_today'
  return 'upcoming'
}