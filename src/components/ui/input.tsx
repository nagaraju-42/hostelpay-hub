import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// ── Sahara Input ──────────────────────────────────────────────────────
// • White background (#fffcf8) — warm white, not cold
// • Warm gray border (#d8d0c8)
// • Sienna focus ring — matches brand primary
// • 44px minimum height for mobile tap targets
// • Manrope font for all data/labels

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      suppressHydrationWarning
      className={cn(
        // Base sizing: min 44px height for mobile (Sahara mobile-first)
        "h-11 w-full min-w-0",
        // Sahara border radius: rounded-lg = 8px
        "rounded-lg",
        // Warm white bg, warm gray border
        "border border-[#d8d0c8] bg-[#fffcf8]",
        // Spacing
        "px-3 py-2",
        // Typography: Manrope for data inputs
        "text-base font-sans text-[#2c1f14]",
        "placeholder:text-[#b0a090]",
        // Transitions
        "transition-colors duration-150",
        // Sienna focus state
        "outline-none",
        "focus-visible:border-[#c2652a] focus-visible:ring-3 focus-visible:ring-[#c2652a]/20",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed",
        "disabled:bg-[#f0e8db] disabled:opacity-60",
        // File input
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#5c3d2a]",
        // Error state
        "aria-invalid:border-[#8c3c3c] aria-invalid:ring-3 aria-invalid:ring-[#8c3c3c]/20",
        // md breakpoint: keep text-base (prevents iOS zoom)
        "md:text-base",
        className
      )}
      {...props}
    />
  )
}

export { Input }
