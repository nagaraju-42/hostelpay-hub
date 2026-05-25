// ══════════════════════════════════════════════════════════════════════════
// HOSTELPAY HUB — Shared TypeScript Types
// All interfaces mirror the Supabase PostgreSQL schema exactly.
// Import these in API routes and React components alike.
// ══════════════════════════════════════════════════════════════════════════
 
// ── Payment mode enum (matches PostgreSQL ENUM type) ─────────────────────
export type PaymentMode = 'cash' | 'upi' | 'bank'
 
// ── Hostel Owner ──────────────────────────────────────────────────────────
export interface HostelOwner {
  id:           string        // UUID — same as auth.users.id
  full_name:    string
  hostel_name:  string
  phone:        string
  hostel_otp:   string | null // 6-digit code for student registration (Phase 2)
  created_at:   string        // ISO 8601 timestamp
}
 
// ── Student ───────────────────────────────────────────────────────────────
export interface Student {
  id:                 string
  owner_id:           string
  full_name:          string
  phone:              string
  parent_phone:       string | null
  emergency_contact:  string | null
  email:              string
  room_number:        string
  age:                number | null
  address:            string | null
  aadhaar_number:     string | null  // max 12 chars — never display in full
  date_of_joining:    string         // ISO date string: '2025-05-12'
  monthly_due_day:    number         // 1-28 — the day of month rent is due
  rent_amount:        number         // INR
  is_active:          boolean
  password_hash:      string | null  // null in MVP — Phase 2 only
  created_at:         string
}
 
// ── Payment ───────────────────────────────────────────────────────────────
export interface Payment {
  id:           string
  student_id:   string
  owner_id:     string
  amount_paid:  number
  payment_mode: PaymentMode
  paid_at:      string  // ISO 8601 timestamp
  due_date:     string  // ISO date: which cycle this covers
  notes:        string | null
  created_at:   string
}
 
// ── Student with Payment History (used in profile page) ──────────────────
export interface StudentWithPayments extends Student {
  payments: Payment[]
}
 
// ── API Response Helpers ──────────────────────────────────────────────────
export interface ApiSuccess<T> {
  data: T
  message?: string
}
 
export interface ApiError {
  error: string
  field?: string  // which form field caused the error
}
 
// ── Form Input Types (for Add/Edit Student forms) ─────────────────────────
export interface StudentFormData {
  full_name:          string
  phone:              string
  parent_phone:       string
  emergency_contact:  string
  email:              string
  room_number:        string
  age:                string   // string from form input — convert to number before API call
  address:            string
  aadhaar_number:     string
  date_of_joining:    string   // 'YYYY-MM-DD'
  monthly_due_day:    string   // string from form input — convert to number
  rent_amount:        string   // string from form input — convert to number
}