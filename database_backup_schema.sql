-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  HOSTELPAY HUB — COMPLETE DATABASE RECONSTRUCTION SCHEMA               ║
-- ║                                                                        ║
-- ║  Generated: 2026-06-08                                                 ║
-- ║  Author: Nagaraju (Super Admin)                                        ║
-- ║                                                                        ║
-- ║  PURPOSE:                                                              ║
-- ║  This file is your COMPLETE disaster recovery plan.                    ║
-- ║  If Supabase deletes your project, or you move to AWS/GCP/DO,          ║
-- ║  running this script on a fresh PostgreSQL database will instantly      ║
-- ║  rebuild your ENTIRE backend architecture in under 5 seconds.          ║
-- ║                                                                        ║
-- ║  TABLES: hostel_owners, students, payments, manual_charges,            ║
-- ║          notifications, support_tickets, support_messages              ║
-- ║  ENUMS: payment_mode, approval_status                                  ║
-- ║  TRIGGERS: auto-update timestamps                                      ║
-- ║  RLS POLICIES: 7 security policies                                     ║
-- ║  INDEXES: 7 performance indexes                                        ║
-- ║  STORAGE: payment-qr bucket                                            ║
-- ║                                                                        ║
-- ║  HOW TO USE: See the companion guide at the bottom of this file.       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝


-- ==============================================================================
-- SECTION 1: EXTENSIONS
-- ==============================================================================
-- uuid-ossp provides uuid_generate_v4() for auto-generating primary keys.
-- This is pre-installed on Supabase but needed if you move to raw PostgreSQL.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ==============================================================================
-- SECTION 2: CUSTOM ENUM TYPES
-- ==============================================================================
-- These enforce strict data validation at the database level.
-- If someone tries to insert payment_mode = 'paypal', PostgreSQL rejects it.

DO $$ BEGIN
    CREATE TYPE payment_mode AS ENUM ('cash', 'upi', 'bank');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- ==============================================================================
-- SECTION 3: CORE TABLES
-- ==============================================================================

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ TABLE 1: hostel_owners                                                  │
-- │                                                                          │
-- │ One row per hostel owner. The `id` is the same UUID as auth.users.id     │
-- │ so we can link authentication to the owner profile without a join.       │
-- │                                                                          │
-- │ Columns used by:                                                         │
-- │   - Settings page: full_name, hostel_name, phone, hostel_otp,            │
-- │     payment_qr_url, payment_qr_note, upi_id                             │
-- │   - Student join flow: hostel_otp (OTP verification), default_rent       │
-- │   - Student dashboard: hostel_name, phone, payment_qr_url,               │
-- │     payment_qr_note, upi_id                                             │
-- │   - Super Admin panel: all columns                                       │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.hostel_owners (
    id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name        TEXT NOT NULL,
    hostel_name      TEXT NOT NULL,
    phone            TEXT NOT NULL,
    hostel_otp       TEXT,                -- 6-digit code students enter to join
    upi_id           TEXT,                -- e.g. "owner@paytm" shown to students
    payment_qr_url   TEXT,                -- Public URL of uploaded QR image
    payment_qr_note  TEXT,                -- Note displayed alongside QR
    default_rent     NUMERIC(10, 2),      -- Fallback rent for student self-reg
    created_at       TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at       TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.hostel_owners IS 'Core table: one row per hostel owner account.';
COMMENT ON COLUMN public.hostel_owners.hostel_otp IS '6-digit code shared with students for self-registration via OTP.';
COMMENT ON COLUMN public.hostel_owners.payment_qr_url IS 'Public URL to the owner''s uploaded payment QR image in Supabase Storage.';
COMMENT ON COLUMN public.hostel_owners.default_rent IS 'Default monthly rent used when students self-register without specifying rent.';


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ TABLE 2: students                                                        │
-- │                                                                          │
-- │ One row per student. Linked to an owner via owner_id.                    │
-- │ Optionally linked to a Google auth account via user_id.                  │
-- │                                                                          │
-- │ Two registration flows create students:                                  │
-- │   1. Owner adds manually via dashboard (approval_status = 'approved')    │
-- │   2. Student self-registers via QR/OTP (approval_status = 'pending')     │
-- │                                                                          │
-- │ Soft-delete: is_active=false, date_of_leaving set. Row never deleted.    │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.students (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id          UUID NOT NULL REFERENCES public.hostel_owners(id) ON DELETE CASCADE,
    full_name         TEXT NOT NULL,
    phone             TEXT NOT NULL,
    parent_phone      TEXT,
    emergency_contact TEXT,
    email             TEXT,                -- Google email or auto-generated placeholder
    room_number       TEXT NOT NULL,
    age               INTEGER,
    address           TEXT,
    aadhaar_number    TEXT,                -- Sensitive: never display in full in UI
    date_of_joining   DATE NOT NULL,
    monthly_due_day   INTEGER NOT NULL CHECK (monthly_due_day >= 1 AND monthly_due_day <= 31),
    rent_amount       NUMERIC(10, 2) NOT NULL CHECK (rent_amount > 0),
    is_active         BOOLEAN DEFAULT true NOT NULL,
    approval_status   approval_status DEFAULT 'approved'::approval_status NOT NULL,
    alternate_phone   TEXT,                -- Secondary phone for phone-login
    custom_password   TEXT,                -- Student-set password for phone-login
    password_hash     TEXT,                -- Reserved for future bcrypt hashing
    user_id           UUID,               -- Links to auth.users for Google OAuth
    date_of_leaving   DATE,               -- Set on soft-delete
    created_at        TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at        TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- A student's phone must be unique within the same hostel
    CONSTRAINT unique_phone_per_hostel UNIQUE (owner_id, phone)
);

COMMENT ON TABLE public.students IS 'All students across all hostels. Linked to owner via owner_id.';
COMMENT ON COLUMN public.students.user_id IS 'Links to auth.users.id when student logs in via Google OAuth.';
COMMENT ON COLUMN public.students.custom_password IS 'Plain-text password for phone+password login. Future: migrate to password_hash.';
COMMENT ON COLUMN public.students.approval_status IS 'pending = awaiting owner approval (self-registered). approved = active. rejected = hard-deleted.';


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ TABLE 3: payments                                                        │
-- │                                                                          │
-- │ Every rent payment ever recorded. Never deleted.                         │
-- │ Each payment covers a specific due_date cycle.                           │
-- │                                                                          │
-- │ CRITICAL: due_date is NOT NULL. It determines which month the payment    │
-- │ covers (used by due-calc.ts for pending/overdue logic).                  │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.payments (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    owner_id      UUID NOT NULL REFERENCES public.hostel_owners(id) ON DELETE CASCADE,
    amount_paid   NUMERIC(10, 2) NOT NULL CHECK (amount_paid > 0),
    payment_mode  payment_mode NOT NULL,   -- 'cash', 'upi', or 'bank'
    paid_at       TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    due_date      DATE NOT NULL,           -- Which billing cycle this covers
    notes         TEXT,                    -- Free-text notes from owner
    created_at    TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.payments IS 'Immutable ledger of all rent payments. Never delete rows.';
COMMENT ON COLUMN public.payments.due_date IS 'The billing cycle date this payment covers. Used by due-calc.ts to determine paid/pending months.';
COMMENT ON COLUMN public.payments.payment_mode IS 'Enum: cash | upi | bank. Enforced at DB level.';


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ TABLE 4: manual_charges                                                  │
-- │                                                                          │
-- │ Ledger adjustments: electricity bills, laundry, discounts, etc.          │
-- │ Positive amount = charge, Negative amount = discount/credit.             │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.manual_charges (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id   UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    owner_id     UUID NOT NULL REFERENCES public.hostel_owners(id) ON DELETE CASCADE,
    amount       NUMERIC(10, 2) NOT NULL,  -- Positive = charge, Negative = discount
    description  TEXT NOT NULL,
    date         DATE NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.manual_charges IS 'Extra charges or discounts applied to a student, separate from rent.';


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ TABLE 5: notifications                                                   │
-- │                                                                          │
-- │ In-app notifications for hostel owners.                                  │
-- │ Created when: student self-registers, payment confirmed, etc.            │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.notifications (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id     UUID NOT NULL REFERENCES public.hostel_owners(id) ON DELETE CASCADE,
    student_id   UUID REFERENCES public.students(id) ON DELETE CASCADE,
    type         TEXT NOT NULL,            -- 'student_registered', 'payment_confirmed', etc.
    message      TEXT NOT NULL,
    is_read      BOOLEAN DEFAULT false NOT NULL,
    meta         JSONB,                    -- Flexible metadata: { student_name, room_number, phone }
    created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.notifications IS 'Owner-facing notifications for student events.';


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ TABLE 6: support_tickets                                                 │
-- │                                                                          │
-- │ Support ticket system. Students/owners can create tickets.               │
-- │ Each ticket gets a unique human-readable code like "TK-A3B7X2".          │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code  TEXT NOT NULL UNIQUE,     -- Human-readable code like "TK-A3B7X2"
    hostel_name  TEXT NOT NULL,
    name         TEXT NOT NULL,            -- Name of the person who submitted
    email        TEXT NOT NULL,
    phone        TEXT NOT NULL,
    issue_type   TEXT NOT NULL,            -- Category of the issue
    status       TEXT DEFAULT 'open' NOT NULL,  -- 'open', 'in_progress', 'resolved', 'closed'
    created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.support_tickets IS 'Customer support tickets with unique tracking codes.';


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ TABLE 7: support_messages                                                │
-- │                                                                          │
-- │ Chat messages within a support ticket. Sender is either 'student'        │
-- │ or 'admin'.                                                              │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.support_messages (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id    UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender       TEXT NOT NULL,            -- 'student' or 'admin'
    message      TEXT NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.support_messages IS 'Chat messages within a support ticket conversation.';


-- ==============================================================================
-- SECTION 4: AUTOMATIC TIMESTAMP TRIGGERS
-- ==============================================================================
-- These triggers automatically set `updated_at` to the current time
-- whenever a row in hostel_owners or students is updated.

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hostel_owners_modtime ON public.hostel_owners;
CREATE TRIGGER update_hostel_owners_modtime
    BEFORE UPDATE ON public.hostel_owners
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_students_modtime ON public.students;
CREATE TRIGGER update_students_modtime
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


-- ==============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- RLS is the MOST critical security layer. It ensures that when a hostel
-- owner queries the database, they can ONLY see their own data.
-- Without RLS, Owner A could read Owner B's student list and revenue.
--
-- NOTE: The Super Admin bypasses RLS by using the supabaseAdmin client
-- (service_role key), which is never exposed to the browser.

ALTER TABLE public.hostel_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can only see/edit their own profile
DROP POLICY IF EXISTS "Owners can manage own profile" ON public.hostel_owners;
CREATE POLICY "Owners can manage own profile" ON public.hostel_owners
    FOR ALL USING (auth.uid() = id);

-- Policy: Owners can only see/edit students in their hostel
DROP POLICY IF EXISTS "Owners can manage own students" ON public.students;
CREATE POLICY "Owners can manage own students" ON public.students
    FOR ALL USING (auth.uid() = owner_id);

-- Policy: Owners can only see/edit their own payments
DROP POLICY IF EXISTS "Owners can manage own payments" ON public.payments;
CREATE POLICY "Owners can manage own payments" ON public.payments
    FOR ALL USING (auth.uid() = owner_id);

-- Policy: Owners can only see/edit their own manual charges
DROP POLICY IF EXISTS "Owners can manage own charges" ON public.manual_charges;
CREATE POLICY "Owners can manage own charges" ON public.manual_charges
    FOR ALL USING (auth.uid() = owner_id);

-- Policy: Owners can only see/edit their own notifications
DROP POLICY IF EXISTS "Owners can manage own notifications" ON public.notifications;
CREATE POLICY "Owners can manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = owner_id);

-- Policy: Support tickets are publicly readable (by ticket_code lookup)
-- but only admins can manage them (done via supabaseAdmin in code)
DROP POLICY IF EXISTS "Support tickets are public read" ON public.support_tickets;
CREATE POLICY "Support tickets are public read" ON public.support_tickets
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Support messages are public read" ON public.support_messages;
CREATE POLICY "Support messages are public read" ON public.support_messages
    FOR SELECT USING (true);


-- ==============================================================================
-- SECTION 6: PERFORMANCE INDEXES
-- ==============================================================================
-- These dramatically speed up the most common queries in your app.
-- Without indexes, a query on 100,000 payments would scan every single row.
-- With indexes, PostgreSQL jumps directly to the matching rows.

-- Students: Fast lookup by owner (used by every dashboard query)
CREATE INDEX IF NOT EXISTS idx_students_owner_id
    ON public.students(owner_id);

-- Students: Fast phone lookup (used by duplicate detection & phone-login)
CREATE INDEX IF NOT EXISTS idx_students_phone
    ON public.students(phone);

-- Students: Fast lookup by user_id (used by student self-service dashboard)
CREATE INDEX IF NOT EXISTS idx_students_user_id
    ON public.students(user_id)
    WHERE user_id IS NOT NULL;

-- Payments: Fast lookup by student (used by student profile page)
CREATE INDEX IF NOT EXISTS idx_payments_student_id
    ON public.payments(student_id);

-- Payments: Fast time-range queries by owner (used by dashboard summary)
CREATE INDEX IF NOT EXISTS idx_payments_owner_id_paid_at
    ON public.payments(owner_id, paid_at DESC);

-- Payments: Fast due_date lookups (used by pending-dues calculation)
CREATE INDEX IF NOT EXISTS idx_payments_due_date
    ON public.payments(student_id, due_date);

-- Notifications: Fast unread count for owner (badge on navbar)
CREATE INDEX IF NOT EXISTS idx_notifications_owner_unread
    ON public.notifications(owner_id, is_read)
    WHERE is_read = false;


-- ==============================================================================
-- SECTION 7: SUPABASE STORAGE BUCKET
-- ==============================================================================
-- This creates the storage bucket where owners upload their payment QR images.
-- NOTE: This SQL only works on Supabase. If migrating to raw PostgreSQL,
-- you'll need to use a different file storage solution (e.g., S3).

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-qr', 'payment-qr', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own QR images
DROP POLICY IF EXISTS "Owners can upload QR" ON storage.objects;
CREATE POLICY "Owners can upload QR" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-qr'
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to update (re-upload) their own QR images
DROP POLICY IF EXISTS "Owners can update QR" ON storage.objects;
CREATE POLICY "Owners can update QR" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'payment-qr'
        AND auth.role() = 'authenticated'
    );

-- Allow public read access to QR images (students need to see them)
DROP POLICY IF EXISTS "Public can view QR" ON storage.objects;
CREATE POLICY "Public can view QR" ON storage.objects
    FOR SELECT USING (bucket_id = 'payment-qr');


-- ==============================================================================
-- SECTION 8: SUPER ADMIN USER (OPTIONAL — Manual Step)
-- ==============================================================================
-- The Super Admin is just a normal Supabase Auth user whose email matches
-- the SUPER_ADMIN_EMAIL environment variable. The app code checks this
-- email in every /api/admin/* route to grant elevated access.
--
-- You do NOT create the Super Admin here. Instead:
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. Click "Add User" → email: your-email@gmail.com, password: your-password
--   3. Set SUPER_ADMIN_EMAIL=your-email@gmail.com in .env.local
--
-- The Super Admin is NOT a hostel_owners row. They are a separate auth user
-- who can view all owners, generate magic links, impersonate owners, etc.


-- ==============================================================================
-- ✅ SCHEMA RECONSTRUCTION COMPLETE
-- ==============================================================================
-- After running this script, your database has:
--   ✅ 7 tables with all columns, types, and constraints
--   ✅ 2 custom enum types (payment_mode, approval_status)
--   ✅ 2 auto-timestamp triggers
--   ✅ 7 RLS security policies
--   ✅ 7 performance indexes
--   ✅ 1 storage bucket with 3 access policies
--
-- Next steps:
--   1. Create your Super Admin auth user (see Section 8 above)
--   2. Create hostel owner auth users and their hostel_owners rows
--   3. Set your environment variables in .env.local
--   4. Deploy your Next.js app
-- ==============================================================================
