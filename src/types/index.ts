// ══════════════════════════════════════════════════════════════════════════
// HOSTELPAY HUB — Shared TypeScript Types
// All interfaces mirror the Supabase PostgreSQL schema exactly.
// Import these in API routes and React components alike.
// ══════════════════════════════════════════════════════════════════════════
 
// ── Payment mode enum (matches PostgreSQL ENUM type) ─────────────────────
export type PaymentMode = 'cash' | 'upi' | 'bank'
 
// ── Hostel Owner ──────────────────────────────────────────────────────────
export interface HostelOwner {
  id:                string        // UUID — same as auth.users.id
  full_name:         string
  hostel_name:       string
  phone:             string
  hostel_otp:        string | null // 6-digit code for student registration
  upi_id:            string | null // Phase 2: UPI ID for payment
  payment_qr_url:    string | null // Phase 2: uploaded QR image URL
  payment_qr_note:   string | null // Phase 2: note shown with QR
  created_at:        string        // ISO 8601 timestamp
}

// ── Notification (owner sees when student self-registers) ─────────────────
export interface Notification {
  id:         string
  owner_id:   string
  student_id: string | null
  type:       'student_registered' | 'payment_confirmed' | string
  message:    string
  is_read:    boolean
  meta:       Record<string, unknown> | null
  created_at: string
  // joined fields
  student?:   { full_name: string; room_number: string; phone: string } | null
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
  billing_type:       'prepaid' | 'postpaid' // Rent due at start (prepaid) or end (postpaid) of cycle
  approval_status:    'pending' | 'approved' | 'rejected'
  alternate_phone?:   string | null
  custom_password?:   string | null
  password_hash:      string | null  // null in MVP
  user_id:            string | null  // Phase 2: links to auth.users via Google OAuth
  date_of_leaving:    string | null
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
  manual_charges?: ManualCharge[]
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
  billing_type:       string   // 'prepaid' or 'postpaid'
}

// ── Student Join Form (for self-registration via QR/OTP) ──────────────────
export interface StudentJoinFormData {
  hostel_otp:      string   // 6-digit code OR empty if coming via QR owner ID
  owner_id?:       string   // set when coming via QR link (bypasses OTP input)
  full_name:       string
  phone:           string
  room_number:     string
  rent_amount?:    string
  monthly_due_day?: string
  aadhaar_number?: string
  address?:        string
}

// ── Owner info enriched with student context (for student dashboard) ───────
export interface OwnerPublicInfo {
  hostel_name:     string
  hostel_otp:      string | null
  payment_qr_url:  string | null
  payment_qr_note: string | null
  upi_id:          string | null
  phone:           string
}

// ── Manual Charge (for Ledger Adjustments) ────────────────────────────────
export interface ManualCharge {
  id:          string
  student_id:  string
  owner_id:    string
  amount:      number   // Positive for charge, Negative for discount
  description: string
  date:        string
  created_at:  string
}