import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function test() {
  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .insert({
      ticket_code: 'TEST-123',
      hostel_name: 'Test Hostel',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      issue_type: 'login',
      status: 'open'
    })
    .select()
    .single()

  if (error) {
    console.error('ERROR:', error)
  } else {
    console.log('SUCCESS:', data)
  }
}

test()
