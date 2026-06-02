import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

function generateTicketCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'TK-'
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hostel_name, name, email, phone, issue_type, message } = body

    if (!hostel_name || !name || !email || !phone || !issue_type || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const ticketCode = generateTicketCode()

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        ticket_code: ticketCode,
        hostel_name,
        name,
        email,
        phone,
        issue_type,
        status: 'open'
      })
      .select()
      .single()

    if (ticketError || !ticket) {
      console.error('[POST /api/support] ticketError:', ticketError)
      return NextResponse.json({ error: 'Failed to create ticket.' }, { status: 500 })
    }

    // Insert first message
    const { error: messageError } = await supabaseAdmin
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender: 'student',
        message
      })

    if (messageError) {
      console.error('[POST /api/support] messageError:', messageError)
      return NextResponse.json({ error: 'Ticket created but failed to save message.' }, { status: 500 })
    }

    return NextResponse.json({ data: { ticket_code: ticketCode } })
  } catch (err) {
    console.error('[POST /api/support]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
