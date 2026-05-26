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
 
  if (loading) return <div className="text-slate-400 p-8 text-center animate-pulse">Loading Super Admin Data...</div>
  
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
        
        <Button onClick={() => setDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
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
              <div key={owner.id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-600 transition-colors">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    {owner.hostel_name}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {owner.full_name} · {owner.phone} · <span className="font-mono text-slate-500">{owner.email}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-4 sm:gap-6 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1"><Users className="w-3.5 h-3.5" /> Students</div>
                    <p className="text-white font-bold text-lg">{students}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-700"></div>
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1"><IndianRupee className="w-3.5 h-3.5" /> Revenue</div>
                    <p className="text-green-400 font-bold text-lg">₹{revenue.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-700"></div>
                  
                  {/* ── NEW VIEW DETAILS BUTTON ── */}
                  <Link href={`/admin/owners/${owner.id}`}>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white px-2">
                      <ExternalLink className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
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