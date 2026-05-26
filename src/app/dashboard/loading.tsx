import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-3 text-sm font-semibold text-slate-600 animate-pulse">Loading data...</p>
      </div>
    </div>
  )
}