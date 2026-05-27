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
    /* ── Sahara Navbar ───────────────────────────────────────────────
       Background: warm white (#fffcf8)
       Border: thin warm-tinted (#d8d0c8 @ 60%)
       Shadow: ultra-soft Sahara shadow
       Height: 56px — comfortable on mobile
    ─────────────────────────────────────────────────────────────── */
    <nav className='sticky top-0 z-50 w-full bg-[#fffcf8] border-b border-[rgba(216,208,200,0.70)] shadow-sahara'>
      <div className='max-w-5xl mx-auto px-4 sm:px-5 h-14 flex items-center justify-between'>

        {/* Logo + Hostel Name */}
        <Link href='/dashboard' className='flex items-center gap-2.5 min-w-0 mr-2 group'>
          {/* Icon: sienna background, Building2 icon */}
          <div className='w-8 h-8 bg-[#c2652a] rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:bg-[#a8561f]'>
            <Building2 className='w-4 h-4 text-[#fffcf8]' />
          </div>
          {/* Text block */}
          <div className='leading-none min-w-0'>
            <p className='text-[9px] sm:text-[10px] text-[#b0a090] uppercase tracking-[0.12em] font-sans'>
              HostelPayHub
            </p>
            <p className='text-xs sm:text-[0.8rem] font-semibold text-[#2c1f14] truncate w-[100px] sm:w-[180px] font-heading'>
              {hostelName}
            </p>
          </div>
        </Link>

        {/* Nav Links + Logout */}
        <div className='flex items-center gap-1 sm:gap-1.5 flex-shrink-0'>

          <Link href='/dashboard/students'>
            <Button
              variant='ghost'
              size='sm'
              className='flex px-2 sm:px-3 gap-1.5 text-[#8a7060] hover:text-[#2c1f14] hover:bg-[#f0e8db] h-9'
            >
              <Users className='w-4 h-4' />
              <span className='hidden sm:inline'>Students</span>
            </Button>
          </Link>

          <Link href='/dashboard/export'>
            <Button
              variant='ghost'
              size='sm'
              className='flex px-2 sm:px-3 gap-1.5 text-[#8a7060] hover:text-[#2c1f14] hover:bg-[#f0e8db] h-9'
            >
              <Download className='w-4 h-4' />
              <span className='hidden sm:inline'>Export</span>
            </Button>
          </Link>

          {/* Divider */}
          <div className='w-px h-5 bg-[rgba(216,208,200,0.70)] mx-0.5' />

          <Button
            variant='ghost'
            size='sm'
            onClick={handleLogout}
            className='flex px-2 sm:px-3 text-[#8a7060] hover:text-[#8c3c3c] hover:bg-[#f5e8e8] h-9'
          >
            <LogOut className='w-4 h-4' />
            <span className='hidden sm:inline ml-1'>Logout</span>
          </Button>

        </div>
      </div>
    </nav>
  )
}