import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  if (!code) {
    return NextResponse.json({ error: 'Ticket code is required' }, { status: 400 })
  }

  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('support_tickets')
    .select('*, support_messages(*)')
    .eq('ticket_code', code)
    .single()

  if (ticketError || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // Sort messages by created_at ascending
  ticket.support_messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return NextResponse.json({ data: ticket })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!code) {
    return NextResponse.json({ error: 'Ticket code is required' }, { status: 400 })
  }

  try {
    const { message, sender } = await request.json()

    if (!message || !sender) {
      return NextResponse.json({ error: 'Message and sender are required' }, { status: 400 })
    }

    // Get ticket ID
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .select('id')
      .eq('ticket_code', code)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender, // 'student' or 'admin'
        message
      })
      .select()
      .single()

    if (messageError) {
      return NextResponse.json({ error: 'Failed to add message' }, { status: 500 })
    }

    return NextResponse.json({ data: newMessage })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
