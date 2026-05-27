import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, AlertTriangle } from 'lucide-react'
 
export default function NotFound() {
  return (
    <main className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
      <div className='text-center max-w-sm'>
        <div className='w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6'>
          <AlertTriangle className='w-10 h-10 text-orange-500' />
        </div>
        <h1 className='text-6xl font-black text-slate-200 mb-2'>404</h1>
        <h2 className='text-xl font-bold text-slate-700 mb-2'>Page Not Found</h2>
        <p className='text-slate-500 text-sm mb-8'>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href='/dashboard'>
          <Button className='bg-blue-600 hover:bg-blue-500 gap-2 h-12 px-6'>
            <Home className='w-4 h-4' />
            Back to Dashboard
          </Button>
        </Link>
        <p className='text-slate-400 text-xs mt-6'>HostelPayHub</p>
      </div>
    </main>
  )
}