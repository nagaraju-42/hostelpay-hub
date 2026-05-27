'use client'
 
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle } from 'lucide-react'
 
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to console in development
    console.error('[App Error]', error)
  }, [error])
 
  return (
    <main className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
      <div className='text-center max-w-sm'>
        <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'>
          <AlertCircle className='w-10 h-10 text-red-500' />
        </div>
        <h1 className='text-xl font-bold text-slate-700 mb-2'>Something Went Wrong</h1>
        <p className='text-slate-500 text-sm mb-2'>
          An unexpected error occurred. This has been logged.
        </p>
        {error.digest && (
          <p className='text-slate-400 text-xs font-mono mb-6'>Error ID: {error.digest}</p>
        )}
        <Button onClick={reset} className='bg-blue-600 hover:bg-blue-500 gap-2 h-11'>
          <RefreshCw className='w-4 h-4' /> Try Again
        </Button>
      </div>
    </main>
  )
}