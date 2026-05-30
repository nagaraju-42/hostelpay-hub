'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TopBar } from '@/components/mobile/TopBar'

// ── Types ──────────────────────────────────────────────────────────────────
interface ParsedRow {
  full_name:        string
  phone:            string
  room_number:      string
  rent_amount:      string
  monthly_due_day:  string
  date_of_joining:  string
  parent_phone:     string
  email:            string
  _valid:           boolean
  _errors:          string[]
}

interface ImportResult {
  imported:       number
  skipped:        number
  errors:         { row: number; name: string; reason: string }[]
  imported_names: string[]
  skipped_names:  { name: string; phone: string; reason: string }[]
}

// ── CSV column name aliases (case-insensitive) ─────────────────────────────
const ALIASES: Record<string, keyof ParsedRow> = {
  'name': 'full_name', 'full name': 'full_name', 'student name': 'full_name', 'full_name': 'full_name',
  'phone': 'phone', 'mobile': 'phone', 'phone number': 'phone', 'mobile number': 'phone',
  'room': 'room_number', 'room no': 'room_number', 'room number': 'room_number', 'room_number': 'room_number',
  'rent': 'rent_amount', 'rent amount': 'rent_amount', 'monthly rent': 'rent_amount', 'rent_amount': 'rent_amount',
  'due day': 'monthly_due_day', 'due date': 'monthly_due_day', 'monthly_due_day': 'monthly_due_day',
  'joining date': 'date_of_joining', 'join date': 'date_of_joining', 'date of joining': 'date_of_joining',
  'parent phone': 'parent_phone', 'parent mobile': 'parent_phone', 'parent_phone': 'parent_phone',
  'email': 'email',
}

// ── Parse CSV text into rows ───────────────────────────────────────────────
function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  const today = new Date().toISOString().split('T')[0]

  return lines.slice(1).map(line => {
    // Handle quoted fields
    const values: string[] = []
    let cur = '', inQ = false
    for (const ch of line + ',') {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { values.push(cur.trim()); cur = '' }
      else { cur += ch }
    }

    const row: ParsedRow = {
      full_name: '', phone: '', room_number: '', rent_amount: '',
      monthly_due_day: '5', date_of_joining: today, parent_phone: '', email: '',
      _valid: true, _errors: [],
    }

    headers.forEach((h, i) => {
      const key = ALIASES[h]
      if (key) (row as any)[key] = values[i] ?? ''
    })

    // Inline validation
    if (!row.full_name.trim()) { row._errors.push('Name required'); row._valid = false }
    const phone = row.phone.trim().replace(/\s/g, '')
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) { row._errors.push('Invalid phone'); row._valid = false }
    else row.phone = phone
    if (!row.room_number.trim()) { row._errors.push('Room required'); row._valid = false }
    const rent = parseFloat(row.rent_amount)
    if (isNaN(rent) || rent <= 0) { row._errors.push('Invalid rent'); row._valid = false }

    return row
  })
}

// ── Download sample CSV ────────────────────────────────────────────────────
function downloadSample() {
  const csv = [
    'Full Name,Phone,Room Number,Rent Amount,Monthly Due Day,Date of Joining,Parent Phone',
    'Ravi Teja,9876543210,101,7000,5,2024-01-01,9876543211',
    'Priya Reddy,9123456789,102,6500,10,2024-02-15,',
    'Suresh Kumar,9988776655,103,8000,1,2023-11-01,9988776600',
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'hostelpay_students_template.csv'
  a.click(); URL.revokeObjectURL(url)
}

// ══════════════════════════════════════════════════════════════════════════
export default function ImportStudentsPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows]           = useState<ParsedRow[]>([])
  const [dragging, setDragging]   = useState(false)
  const [step, setStep]           = useState<'upload' | 'preview' | 'done'>('upload')
  const [importing, setImporting] = useState(false)
  const [result, setResult]       = useState<ImportResult | null>(null)

  const validRows   = rows.filter(r => r._valid)
  const invalidRows = rows.filter(r => !r._valid)

  // Handle file
  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file'); return
    }
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) { toast.error('CSV is empty or unreadable'); return }
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file)
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  async function handleImport() {
    if (validRows.length === 0) { toast.error('No valid rows to import.'); return }
    setImporting(true)
    try {
      const res = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Import failed.'); return }
      setResult(data.data)
      setStep('done')
      toast.success(`${data.data.imported} students imported!`)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  // ── Inline cell edit ──────────────────────────────────────────────────────
  function editCell(rowIdx: number, key: keyof ParsedRow, val: string) {
    setRows(prev => {
      const next = [...prev]
      const row = { ...next[rowIdx], [key]: val }
      // re-validate
      row._errors = []
      if (!row.full_name.trim()) row._errors.push('Name required')
      const ph = row.phone.trim().replace(/\s/g, '')
      if (!ph || !/^[6-9]\d{9}$/.test(ph)) row._errors.push('Invalid phone')
      if (!row.room_number.trim()) row._errors.push('Room required')
      if (isNaN(parseFloat(row.rent_amount)) || parseFloat(row.rent_amount) <= 0) row._errors.push('Invalid rent')
      row._valid = row._errors.length === 0
      next[rowIdx] = row
      return next
    })
  }

  function removeRow(idx: number) {
    setRows(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const cellInput = (hasErr = false): React.CSSProperties => ({
    width: '100%', padding: '5px 8px', borderRadius: 6,
    border: hasErr ? '1.5px solid #DC2626' : '1px solid #E2E8F0',
    background: hasErr ? '#FEF2F2' : '#F8FAFC',
    fontSize: 11, fontFamily: '"DM Sans", sans-serif',
    color: '#1E293B', outline: 'none', boxSizing: 'border-box',
    minWidth: 80,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar title="Import Students" sub="Bulk upload via CSV" backHref="/dashboard/students" />

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* ── STEP 1: UPLOAD ── */}
        {step === 'upload' && (
          <div style={{ padding: '16px' }}>
            {/* Info card */}
            <div style={{
              background: 'linear-gradient(135deg, #0F2744, #1a3a5c)',
              borderRadius: 14, padding: '16px',
              marginBottom: 14,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: '"DM Sans", sans-serif', marginBottom: 6 }}>
                📋 How it works
              </div>
              {[
                '1. Download the template CSV below',
                '2. Fill it with student data (Name, Phone, Room, Rent)',
                '3. Upload — system skips duplicates automatically',
                '4. Review & confirm before saving',
              ].map((s, i) => (
                <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: '"DM Sans", sans-serif', marginBottom: 3 }}>{s}</div>
              ))}
            </div>

            {/* Template download */}
            <button
              onClick={downloadSample}
              style={{
                width: '100%', padding: '13px', borderRadius: 12,
                background: '#ECFDF5', border: '1px solid #A7F3D0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 13, fontWeight: 600, color: '#065F46',
                fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                marginBottom: 12, boxSizing: 'border-box',
              }}
            >
              📥 Download Template CSV
            </button>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? '#0F2744' : '#CBD5E1'}`,
                borderRadius: 14,
                padding: '40px 20px',
                textAlign: 'center',
                background: dragging ? '#EFF6FF' : '#F8FAFC',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', fontFamily: '"DM Sans", sans-serif' }}>
                Tap to choose CSV file
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>
                or drag and drop here
              </div>
              <input
                ref={fileRef} type="file" accept=".csv"
                onChange={onFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Required columns note */}
            <div style={{
              marginTop: 14, background: '#FEF3C7', borderRadius: 10,
              padding: '10px 14px', border: '1px solid #FDE68A',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', fontFamily: '"DM Sans", sans-serif', marginBottom: 4 }}>
                ⚠️ REQUIRED COLUMNS
              </div>
              <div style={{ fontSize: 11, color: '#92400E', fontFamily: '"DM Sans", sans-serif' }}>
                <b>Full Name</b>, <b>Phone</b>, <b>Room Number</b>, <b>Rent Amount</b>
              </div>
              <div style={{ fontSize: 10, color: '#B45309', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>
                Optional: Monthly Due Day, Date of Joining, Parent Phone, Email
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: PREVIEW ── */}
        {step === 'preview' && (
          <div>
            {/* Summary bar */}
            <div style={{
              background: '#F8FAFC', padding: '12px 16px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', fontFamily: '"DM Sans", sans-serif' }}>
                  {rows.length} rows detected
                </div>
                <div style={{ fontSize: 11, fontFamily: '"DM Sans", sans-serif' }}>
                  <span style={{ color: '#059669', fontWeight: 600 }}>✅ {validRows.length} valid</span>
                  {invalidRows.length > 0 && (
                    <span style={{ color: '#DC2626', fontWeight: 600 }}> · ❌ {invalidRows.length} errors</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setStep('upload'); setRows([]) }}
                style={{
                  background: '#F1F5F9', border: '1px solid #E2E8F0',
                  borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600, color: '#64748B',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                Change file
              </button>
            </div>

            {/* Error summary */}
            {invalidRows.length > 0 && (
              <div style={{ margin: '12px 16px 0', background: '#FEF2F2', borderRadius: 10, padding: '10px 14px', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', fontFamily: '"DM Sans", sans-serif', marginBottom: 4 }}>
                  {invalidRows.length} rows have errors — fix inline or they'll be skipped
                </div>
              </div>
            )}

            {/* Scrollable table */}
            <div style={{ overflowX: 'auto', margin: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr style={{ background: '#0F2744' }}>
                    {['#', 'Name *', 'Phone *', 'Room *', 'Rent *', 'Due Day', 'Join Date', ''].map((h, i) => (
                      <th key={i} style={{
                        padding: '9px 8px', textAlign: 'left',
                        fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                        fontFamily: '"DM Sans", sans-serif', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const hasErr = !row._valid
                    return (
                      <tr key={i} style={{
                        background: hasErr ? '#FEF2F2' : i % 2 === 0 ? '#fff' : '#F8FAFC',
                        borderBottom: '1px solid #F1F5F9',
                      }}>
                        <td style={{ padding: '6px 8px', fontSize: 10, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif', verticalAlign: 'middle' }}>
                          {hasErr ? '❌' : '✅'} {i + 1}
                        </td>
                        {(['full_name', 'phone', 'room_number', 'rent_amount', 'monthly_due_day', 'date_of_joining'] as const).map(key => (
                          <td key={key} style={{ padding: '4px 6px', verticalAlign: 'middle' }}>
                            <input
                              value={row[key]}
                              onChange={e => editCell(i, key, e.target.value)}
                              style={cellInput(hasErr && (
                                (key === 'full_name' && !row.full_name.trim()) ||
                                (key === 'phone' && !/^[6-9]\d{9}$/.test(row.phone.trim())) ||
                                (key === 'room_number' && !row.room_number.trim()) ||
                                (key === 'rent_amount' && isNaN(parseFloat(row.rent_amount)))
                              ))}
                              type={key === 'date_of_joining' ? 'date' : key === 'rent_amount' || key === 'monthly_due_day' ? 'number' : 'text'}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '4px 6px', verticalAlign: 'middle' }}>
                          <button
                            onClick={() => removeRow(i)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 14, color: '#CBD5E1', padding: '2px 4px',
                            }}
                            title="Remove row"
                          >🗑</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Error detail cards */}
            {invalidRows.length > 0 && (
              <div style={{ margin: '0 16px 12px' }}>
                {rows.map((row, i) => !row._valid && (
                  <div key={i} style={{
                    background: '#FEF2F2', borderRadius: 8, padding: '8px 12px',
                    marginBottom: 6, border: '1px solid #FECACA',
                    fontSize: 11, fontFamily: '"DM Sans", sans-serif',
                  }}>
                    <span style={{ fontWeight: 700, color: '#991B1B' }}>Row {i + 1} — {row.full_name || '(no name)'}: </span>
                    <span style={{ color: '#B91C1C' }}>{row._errors.join(', ')}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ padding: '0 16px 24px', display: 'flex', gap: 9 }}>
              <button
                onClick={() => { setStep('upload'); setRows([]) }}
                style={{
                  flex: 1, padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0',
                  background: '#F8FAFC', color: '#64748B', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing || validRows.length === 0}
                style={{
                  flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                  background: importing || validRows.length === 0 ? '#94A3B8' : '#0F2744',
                  color: '#fff', cursor: importing || validRows.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
                }}
              >
                {importing ? 'Importing…' : `✅ Import ${validRows.length} Student${validRows.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: RESULT ── */}
        {step === 'done' && result && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Big success card */}
            <div style={{
              background: result.imported > 0
                ? 'linear-gradient(135deg, #065F46, #059669)'
                : 'linear-gradient(135deg, #92400E, #D97706)',
              borderRadius: 16, padding: '24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>
                {result.imported > 0 ? '🎉' : '⚠️'}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: '"DM Serif Display", serif' }}>
                {result.imported} Imported
              </div>
              {result.skipped > 0 && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>
                  {result.skipped} skipped · {result.errors.length} errors
                </div>
              )}
            </div>

            {/* Skipped details */}
            {result.skipped_names.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: '"DM Sans", sans-serif', marginBottom: 10, letterSpacing: '0.5px' }}>
                  SKIPPED ({result.skipped_names.length})
                </div>
                {result.skipped_names.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 0', borderBottom: i < result.skipped_names.length - 1 ? '1px solid #F1F5F9' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', fontFamily: '"DM Sans", sans-serif' }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: '"DM Sans", sans-serif' }}>{s.phone} · {s.reason}</div>
                    </div>
                    <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', borderRadius: 4, padding: '2px 6px', fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
                      Skipped
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Error details */}
            {result.errors.length > 0 && (
              <div style={{ background: '#FEF2F2', borderRadius: 14, border: '1px solid #FECACA', padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', fontFamily: '"DM Sans", sans-serif', marginBottom: 8 }}>
                  VALIDATION ERRORS ({result.errors.length})
                </div>
                {result.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#B91C1C', fontFamily: '"DM Sans", sans-serif', marginBottom: 4 }}>
                    Row {e.row} — {e.name}: {e.reason}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 9 }}>
              <button
                onClick={() => { setStep('upload'); setRows([]); setResult(null) }}
                style={{
                  flex: 1, padding: '13px', borderRadius: 12,
                  background: '#F1F5F9', border: '1px solid #E2E8F0',
                  color: '#64748B', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                }}
              >
                Import More
              </button>
              <button
                onClick={() => router.push('/dashboard/students')}
                style={{
                  flex: 2, padding: '13px', borderRadius: 12,
                  background: '#0F2744', border: 'none',
                  color: '#fff', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
                }}
              >
                👥 View All Students →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
