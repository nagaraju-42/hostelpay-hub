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
      // ── Loading overlay: warm dark with sienna spinner ──
      <div className="fixed inset-0 bg-[#2c1f14]/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
        <div className="bg-[#3a2819] p-6 rounded-2xl shadow-sahara-lg border border-[rgba(216,208,200,0.12)] flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-[rgba(216,208,200,0.15)] border-t-[#c2652a] rounded-full animate-spin" />
          <p className="mt-4 text-sm font-sans font-semibold text-[#f5ede2] animate-pulse">
            Loading Platform Data...
          </p>
        </div>
      </div>
    )
  }

  if (error) return (
    <div className="bg-[#f5e8e4] border border-[rgba(140,60,60,0.30)] text-[#8c3c3c] p-4 rounded-xl text-center">
      <p className="font-sans">Error: {error}</p>
      <p className="text-sm mt-2 text-[#a06060] font-sans">
        Ensure you are logged in with the SUPER_ADMIN_EMAIL.
      </p>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[1.75rem] font-semibold text-[#f5ede2] leading-tight">
            Platform Overview
          </h1>
          <p className="text-[#8a7060] text-sm mt-1 font-sans">
            Manage all registered hostel owners.
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          size='lg'
          className="w-full sm:w-auto gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Owner
        </Button>
      </div>

      {/* ── Owner Cards ──────────────────────────────────────────────── */}
      <div className="grid gap-4">
        {owners.length === 0 ? (
          <div className="text-center py-12 bg-[#3a2819] rounded-2xl border border-dashed border-[rgba(216,208,200,0.15)]">
            <Building2 className="w-12 h-12 text-[#6a5040] mx-auto mb-3" />
            <p className="text-[#8a7060] font-sans font-medium">No hostel owners yet</p>
          </div>
        ) : (
          owners.map(owner => {
            const revenue = owner.monthly_revenue || 0;
            const students = owner.student_count || 0;

            return (
              <div
                key={owner.id}
                className={[
                  'bg-[#3a2819] p-4 sm:p-5 rounded-2xl',
                  'border border-[rgba(216,208,200,0.10)]',
                  'flex flex-col lg:flex-row lg:items-center justify-between gap-4',
                  'hover:border-[rgba(216,208,200,0.20)] transition-colors relative',
                ].join(' ')}
              >
                {/* Info Section */}
                <div className="pr-10 lg:pr-0">
                  <h3 className="text-base font-heading font-semibold text-[#f5ede2] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#c2652a] flex-shrink-0" />
                    <span className="truncate">{owner.hostel_name}</span>
                  </h3>
                  <p className="text-[#8a7060] text-xs sm:text-sm mt-1 truncate font-sans">
                    {owner.full_name} · {owner.phone}
                  </p>
                  <p className="font-mono text-[#6a5040] text-xs sm:text-sm truncate mt-0.5">
                    {owner.email}
                  </p>
                </div>

                {/* Stats Section */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-6 bg-[#2c1f14]/60 p-3 rounded-xl border border-[rgba(216,208,200,0.08)]">
                  <div className="flex-1 sm:flex-none">
                    <div className="flex items-center gap-1.5 text-[#6a5040] text-xs mb-1 font-sans">
                      <Users className="w-3.5 h-3.5" /> Students
                    </div>
                    <p className="text-[#f5ede2] font-heading font-bold text-base sm:text-lg">{students}</p>
                  </div>
                  <div className="w-px h-8 bg-[rgba(216,208,200,0.08)] hidden sm:block" />
                  <div className="flex-1 sm:flex-none">
                    <div className="flex items-center gap-1.5 text-[#6a5040] text-xs mb-1 font-sans">
                      <IndianRupee className="w-3.5 h-3.5" /> Revenue
                    </div>
                    {/* Earthy sage green for revenue — not harsh green */}
                    <p className="text-[#7aaa5a] font-heading font-bold text-base sm:text-lg">
                      ₹{revenue.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* View Details Button */}
                <Link
                  href={`/admin/owners/${owner.id}`}
                  className="absolute top-4 right-4 lg:relative lg:top-0 lg:right-0"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#6a5040] hover:text-[#f5ede2] hover:bg-[#4a3020] px-2 lg:px-3"
                  >
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