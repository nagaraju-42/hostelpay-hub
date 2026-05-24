import { createBrowserClient } from '@supabase/ssr'
 
// This client uses the ANON key — safe to expose to the browser.
// It reads the session from a cookie set by the server.
// USE THIS in: React client components ('use client' files), useEffect hooks
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}