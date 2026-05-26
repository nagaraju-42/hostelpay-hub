import { Loader2 } from 'lucide-react'
 
export default function DashboardLoading() {
  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-slate-400 text-sm font-medium animate-pulse tracking-wide">
        Fetching data...
      </p>
    </div>
  )
}