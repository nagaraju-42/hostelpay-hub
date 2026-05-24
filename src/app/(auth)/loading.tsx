import { Loader2 } from 'lucide-react'

export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* The spinner */}
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      {/* The text */}
      <p className="text-slate-400 text-sm font-medium animate-pulse">
        Waking up server...
      </p>
    </div>
  )
}