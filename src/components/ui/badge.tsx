import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ── Sahara Badge Variants ─────────────────────────────────────────────
// Status badges use earthy, muted tones — no harsh greens or reds.
// "Paid" → sage green  |  "Overdue" → warm terracotta  |  "Due" → amber
// Default → sienna fill (brand)

const badgeVariants = cva(
  [
    "group/badge inline-flex h-[1.375rem] w-fit shrink-0 items-center justify-center gap-1",
    "overflow-hidden rounded-full border border-transparent",
    "px-2.5 py-0.5 text-xs font-medium font-sans whitespace-nowrap",
    "transition-all duration-150",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
    "[&>svg]:pointer-events-none [&>svg]:size-3!",
  ].join(" "),
  {
    variants: {
      variant: {
        // Brand primary: burnt sienna
        default:
          "bg-[#c2652a] text-[#fffcf8] border-[#c2652a]",

        // Earthy sage green for "Paid" status — not harsh green
        paid:
          "bg-[#e8f0e0] text-[#4a6b3a] border-[#c8deb8]",

        // Warm terracotta for "Overdue" — not harsh red
        overdue:
          "bg-[#f0e4d8] text-[#8c4a2a] border-[#d4b8a0]",

        // Warm amber for "Due Today" — not yellow
        due:
          "bg-[#fdf4e8] text-[#7a5020] border-[#e8d0a0]",

        // Warm sand — secondary / neutral
        secondary:
          "bg-[#f0e8db] text-[#5c3d2a] border-[#d8d0c8]",

        // Dusty rose accent — sparse emphasis
        accent:
          "bg-[#f5e8e8] text-[#8c3c3c] border-[#d4b8b8]",

        // Earthy muted red — destructive (replaces harsh red)
        destructive:
          "bg-[#f5e4e0] text-[#8c3c3c] border-[#d4b0a8]",

        // Outlined — warm border
        outline:
          "border-[#d8d0c8] text-[#5c3d2a] bg-transparent",

        // Ghost — subtle
        ghost:
          "text-[#8a7060] hover:bg-[#f0e8db] hover:text-[#5c3d2a]",

        // Payment modes
        cash:   "bg-[#e8f0e0] text-[#4a6b3a] border-[#c8deb8]",
        upi:    "bg-[#e8eefc] text-[#3a4a8c] border-[#b8c8e8]",
        bank:   "bg-[#f0e8f5] text-[#5c3a8c] border-[#d0b8e0]",

        // Legacy link
        link: "text-[#c2652a] underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
