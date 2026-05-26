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
      <div className='max-w-5xl mx-auto px-4 h-14 flex items-center justify-between'>
 
        {/* Logo + Hostel Name */}
        <Link href='/dashboard' className='flex items-center gap-2.5'>
          <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0'>
            <Building2 className='w-4 h-4 text-white' />
          </div>
          <div className='leading-none'>
            <p className='text-[10px] text-slate-400 uppercase tracking-wider'>HostelPayHub</p>
            <p className='text-sm font-semibold text-slate-800 truncate max-w-[160px]'>{hostelName}</p>
          </div>
        </Link>
 
        {/* Nav Links + Logout */}
        <div className='flex items-center gap-1 sm:gap-2'>
          
          <Link href='/dashboard/students'>
            <Button variant='ghost' size='sm' className='hidden sm:flex gap-1.5 text-slate-600 hover:text-slate-900'>
              <Users className='w-4 h-4' /> Students
            </Button>
          </Link>

          {/* ── NEW EXPORT BUTTON ── */}
          <Link href='/dashboard/export'>
            <Button variant='ghost' size='sm' className='hidden sm:flex gap-1.5 text-slate-600 hover:text-slate-900'>
              <Download className='w-4 h-4' /> Export
            </Button>
          </Link>
          
          <div className='w-px h-5 bg-slate-200 hidden sm:block mx-1'></div>

          <Button variant='ghost' size='sm' onClick={handleLogout}
            className='text-slate-500 hover:text-red-600 hover:bg-red-50'>
            <LogOut className='w-4 h-4' />
            <span className='hidden sm:inline ml-1.5'>Logout</span>
          </Button>

        </div>
      </div>
    </nav>
  )
}