import { cn } from "@/lib/utils"

// ── Sahara Skeleton ───────────────────────────────────────────────────
// Warm shimmer animation instead of cold gray pulse

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-lg",
        // Warm shimmer — not cold gray
        "bg-[#ede4d6]",
        "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
