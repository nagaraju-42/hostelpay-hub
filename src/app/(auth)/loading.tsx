import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// ── Sahara Auth Loading ───────────────────────────────────────────────
// Shows while the auth layout's server-side session check runs

export default function AuthLoading() {
  return (
    <div className='flex flex-col items-center justify-center min-h-[50vh] gap-3'>
      <LoadingSpinner size='lg' label='Checking session...' />
    </div>
  )
}