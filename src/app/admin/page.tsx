'use client'
 
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Users, IndianRupee, Building2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddOwnerDialog } from '@/components/admin/AddOwnerDialog'
import type { OwnerWithStats } from '@/app/api/admin/owners/route'
 
export default function AdminDashboardPage() {
  const [owners, setOwners] = useState<OwnerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
 
  useEffect(() => {
    fetch('/api/admin/owners')
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setOwners(data.data || [])
      })
      .catch(() => setError('Network error while fetching owners.'))
      .finally(() => setLoading(false))
  }, [])
 
  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
        <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-slate-600 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-semibold text-slate-300 animate-pulse">Loading Platform Data...</p>
        </div>
      </div>
    )
  }
  
  if (error) return (
    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl text-center">
      <p>Error: {error}</p>
      <p className="text-sm mt-2 text-red-400">Ensure you are logged in with the SUPER_ADMIN_EMAIL.</p>
    </div>
  )
 
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Manage all registered hostel owners.</p>
        </div>
        
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Add New Owner
        </Button>
      </div>
 
      <div className="grid gap-4">
        {owners.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-2xl border border-slate-700 border-dashed">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">No hostel owners yet</p>
          </div>
        ) : (
          owners.map(owner => {
            const revenue = owner.monthly_revenue || 0;
            const students = owner.student_count || 0;
 
            return (
              <div key={owner.id} className="bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-slate-600 transition-colors relative">
                
                {/* Info Section */}
                <div className="pr-10 lg:pr-0">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="truncate">{owner.hostel_name}</span>
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1 truncate">
                    {owner.full_name} · {owner.phone}
                  </p>
                  <p className="font-mono text-slate-500 text-xs sm:text-sm truncate mt-0.5">{owner.email}</p>
                </div>
                
                {/* Stats Section */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-6 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                  <div className="flex-1 sm:flex-none">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1"><Users className="w-3.5 h-3.5" /> Students</div>
                    <p className="text-white font-bold text-base sm:text-lg">{students}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-700 hidden sm:block"></div>
                  <div className="flex-1 sm:flex-none">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1"><IndianRupee className="w-3.5 h-3.5" /> Revenue</div>
                    <p className="text-green-400 font-bold text-base sm:text-lg">₹{revenue.toLocaleString('en-IN')}</p>
                  </div>
                </div>
 
                {/* View Details Button - Positioned absolute on mobile top-right, flow on desktop */}
                <Link href={`/admin/owners/${owner.id}`} className="absolute top-4 right-4 lg:relative lg:top-0 lg:right-0">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white px-2 lg:bg-slate-700 lg:hover:bg-slate-600">
                    <ExternalLink className="w-5 h-5 lg:w-4 lg:h-4" />
                    <span className="hidden lg:inline ml-2">View</span>
                  </Button>
                </Link>
              </div>
            )
          })
        )}
      </div>
      
      <AddOwnerDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={(newOwner) => {
          const formattedOwner = { ...newOwner, monthly_revenue: newOwner.monthly_revenue || 0, student_count: newOwner.student_count || 0 };
          setOwners([formattedOwner, ...owners]);
          setDialogOpen(false);
        }} 
      />
    </div>
  )
}