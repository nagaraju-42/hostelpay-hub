import { Loader2 } from 'lucide-react'
 
export default function GlobalLoading() {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center space-y-4">
      <div className="p-4 bg-white rounded-full shadow-md border border-slate-100">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
      <p className="text-slate-500 text-sm font-medium animate-pulse tracking-wide">
        Loading...
      </p>
    </div>
  )
}