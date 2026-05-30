import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import type { ApiSuccess, ApiError } from '@/types'

// ══════════════════════════════════════════════════════════════════════════
// POST /api/students/import
// Bulk-imports an array of students for this owner.
// Validates each row, skips duplicates (by phone), returns a detailed report.
// ══════════════════════════════════════════════════════════════════════════

interface ImportRow {
  full_name:        string
  phone:            string
  room_number:      string
  rent_amount:      string | number
  monthly_due_day?: string | number
  date_of_joining?: string
  parent_phone?:    string
  address?:         string
  email?:           string
}

interface ImportResult {
  imported:  number
  skipped:   number
  errors:    { row: number; name: string; reason: string }[]
  imported_names: string[]
  skipped_names:  { name: string; phone: string; reason: string }[]
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthSession()
  if (!user) return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })

  let rows: ImportRow[]
  try {
    const body = await request.json()
    rows = body.rows
    if (!Array.isArray(rows) || rows.length === 0) throw new Error()
  } catch {
    return NextResponse.json<ApiError>({ error: 'Invalid import data. Send { rows: [...] }' }, { status: 400 })
  }

  if (rows.length > 200) {
    return NextResponse.json<ApiError>({ error: 'Maximum 200 students per import.' }, { status: 400 })
  }

  // 1. Fetch all existing phones for this owner to detect duplicates fast
  const { data: existing } = await supabase
    .from('students')
    .select('phone, full_name')
    .eq('owner_id', user.id)
    .eq('is_active', true)

  const existingPhones = new Set((existing ?? []).map(s => s.phone.trim()))

  const result: ImportResult = {
    imported: 0, skipped: 0,
    errors: [], imported_names: [], skipped_names: [],
  }

  const today = new Date().toISOString().split('T')[0]

  // 2. Validate & batch insert in chunks of 20
  const toInsert: object[] = []
  const seenPhones = new Set<string>()  // track duplicates within this CSV itself

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1
    const name = row.full_name?.trim() || `Row ${rowNum}`

    // Basic validation
    if (!row.full_name?.trim()) {
      result.errors.push({ row: rowNum, name, reason: 'Full name is missing.' })
      continue
    }
    const phone = row.phone?.toString().trim().replace(/\s/g, '')
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      result.errors.push({ row: rowNum, name, reason: `Invalid phone: "${row.phone}". Must be 10-digit Indian mobile.` })
      continue
    }
    if (!row.room_number?.toString().trim()) {
      result.errors.push({ row: rowNum, name, reason: 'Room number is missing.' })
      continue
    }
    const rent = parseFloat(String(row.rent_amount))
    if (isNaN(rent) || rent <= 0) {
      result.errors.push({ row: rowNum, name, reason: `Invalid rent amount: "${row.rent_amount}".` })
      continue
    }

    // Duplicate phone check — existing in DB
    if (existingPhones.has(phone)) {
      result.skipped++
      result.skipped_names.push({ name, phone, reason: 'Already exists in hostel.' })
      continue
    }

    // Duplicate within this CSV
    if (seenPhones.has(phone)) {
      result.skipped++
      result.skipped_names.push({ name, phone, reason: 'Duplicate phone in CSV.' })
      continue
    }
    seenPhones.add(phone)

    const dueDay = parseInt(String(row.monthly_due_day ?? 5))
    toInsert.push({
      owner_id:        user.id,
      full_name:       row.full_name.trim(),
      phone,
      room_number:     row.room_number.toString().trim(),
      rent_amount:     rent,
      monthly_due_day: isNaN(dueDay) || dueDay < 1 || dueDay > 28 ? 5 : dueDay,
      date_of_joining: row.date_of_joining || today,
      email:           row.email?.trim().toLowerCase() || `${phone}@hostelpay.local`,
      parent_phone:    row.parent_phone?.trim() || null,
      address:         row.address?.trim() || null,
      is_active:       true,
      approval_status: 'approved',
    })
    result.imported_names.push(row.full_name.trim())
  }

  // 3. Batch insert in chunks of 20 to avoid payload limits
  if (toInsert.length > 0) {
    const CHUNK = 20
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const chunk = toInsert.slice(i, i + CHUNK)
      const { data: inserted, error: insertErr } = await supabase
        .from('students')
        .insert(chunk)
        .select('full_name, phone')

      if (insertErr) {
        console.error('[POST /api/students/import] chunk error:', insertErr)
        // If a chunk fails due to a unique constraint in the DB (race condition),
        // mark each row in this chunk as skipped
        for (const r of chunk) {
          const row = r as { full_name: string; phone: string }
          result.skipped++
          result.skipped_names.push({ name: row.full_name, phone: row.phone, reason: 'DB insert failed (possible duplicate).' })
          // Remove from imported_names
          const idx = result.imported_names.indexOf(row.full_name)
          if (idx !== -1) result.imported_names.splice(idx, 1)
        }
      } else {
        result.imported += (inserted ?? []).length
      }
    }
  }

  return NextResponse.json<ApiSuccess<ImportResult>>({
    data: result,
    message: `Imported ${result.imported} students. Skipped ${result.skipped}.`,
  })
}
