import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ── Sahara Button Variants ────────────────────────────────────────────
// • Primary  : solid burnt sienna (#c2652a), 8px radius, min-h 44px on mobile
// • Outline  : warm border, sienna hover
// • Ghost    : transparent, warm hover
// • Secondary: warm sand fill
// • Destructive: muted earthy red (never harsh)
// • Link     : sienna underline

const buttonVariants = cva(
  // Base — shared across all variants
  [
    "group/button inline-flex shrink-0 items-center justify-center",
    "rounded-lg border border-transparent bg-clip-padding",
    "text-sm font-medium font-sans whitespace-nowrap",
    "transition-all duration-150 outline-none select-none",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        // Solid sienna fill — the primary Sahara CTA
        default:
          "bg-[#c2652a] text-[#fffcf8] hover:bg-[#a8561f] active:bg-[#944b1b] shadow-sahara",

        // Warm outlined — secondary action
        outline:
          "border-[#d8d0c8] bg-[#fffcf8] text-[#5c3d2a] hover:bg-[#f0e8db] hover:border-[#c2652a]/40 hover:text-[#c2652a]",

        // Warm sand fill — tertiary
        secondary:
          "bg-[#f0e8db] text-[#5c3d2a] hover:bg-[#e8ddd0] hover:text-[#2c1f14]",

        // Transparent + warm hover
        ghost:
          "text-[#5c3d2a] hover:bg-[#f0e8db] hover:text-[#2c1f14]",

        // Muted earthy red — never harsh green/red
        destructive:
          "bg-[#f0ddd8] text-[#8c3c3c] hover:bg-[#e8cfc8] focus-visible:border-[#8c3c3c]/40 focus-visible:ring-[#8c3c3c]/20",

        // Text link — sienna underline on hover
        link: "text-[#c2652a] underline-offset-4 hover:underline hover:text-[#a8561f]",
      },
      size: {
        // Default: 36px tall — comfortable but not oversized on mobile
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-7 gap-1 rounded-md px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-lg px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        // Large: 44px — minimum tap target for mobile (WCAG / Sahara spec)
        lg: "h-11 gap-1.5 px-4 text-base",
        icon:     "size-9",
        "icon-xs":"size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":"size-8 rounded-lg",
        "icon-lg":"size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      suppressHydrationWarning
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
