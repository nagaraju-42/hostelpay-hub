'use client'
 
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Building2, LogOut, Users, Download } from 'lucide-react'
import Link from 'next/link'
 
interface NavbarProps {
  hostelName: string
}
 
export function Navbar({ hostelName }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
 
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
 
  return (
    <nav className='sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm'>
      <div className='max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between'>
 
        {/* Logo + Hostel Name */}
        <Link href='/dashboard' className='flex items-center gap-2 sm:gap-2.5 min-w-0 mr-2'>
          <div className='w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0'>
            <Building2 className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-white' />
          </div>
          <div className='leading-none min-w-0'>
            <p className='text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider'>HostelPayHub</p>
            <p className='text-xs sm:text-sm font-semibold text-slate-800 truncate w-[100px] sm:w-[160px]'>{hostelName}</p>
          </div>
        </Link>
 
        {/* Nav Links + Logout (Mobile Priority Fixes) */}
        <div className='flex items-center gap-1 sm:gap-2 flex-shrink-0'>
          
          <Link href='/dashboard/students'>
            <Button variant='ghost' size='sm' className='flex px-2 sm:px-3 gap-1.5 text-slate-600 hover:text-slate-900'>
              <Users className='w-4 h-4 sm:w-4 sm:h-4' /> 
              <span className='hidden sm:inline'>Students</span>
            </Button>
          </Link>
 
          <Link href='/dashboard/export'>
            <Button variant='ghost' size='sm' className='flex px-2 sm:px-3 gap-1.5 text-slate-600 hover:text-slate-900'>
              <Download className='w-4 h-4 sm:w-4 sm:h-4' /> 
              <span className='hidden sm:inline'>Export</span>
            </Button>
          </Link>
          
          <div className='w-px h-5 bg-slate-200 mx-1'></div>
 
          <Button variant='ghost' size='sm' onClick={handleLogout}
            className='flex px-2 sm:px-3 text-slate-500 hover:text-red-600 hover:bg-red-50'>
            <LogOut className='w-4 h-4 sm:w-4 sm:h-4' />
            <span className='hidden sm:inline ml-1.5'>Logout</span>
          </Button>
 
        </div>
      </div>
    </nav>
  )
}