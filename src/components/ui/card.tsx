import * as React from "react"

import { cn } from "@/lib/utils"

// ── Sahara Card ───────────────────────────────────────────────────────
// • Warm white surface (#fffcf8) — never cold white
// • Generous padding: 28–32px (Sahara spec)
// • Minimal warm-tinted border at 60% opacity
// • Ultra-soft Sahara shadow
// • No dark ring — border provides hierarchy

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        // Base card surface
        "group/card flex flex-col gap-4 overflow-hidden",
        "rounded-2xl bg-[#fffcf8]",
        "border border-[rgba(216,208,200,0.60)]",
        "shadow-sahara",
        "text-sm text-card-foreground",
        // Padding handled by CardHeader / CardContent / CardFooter
        "py-0",
        // Size variant
        "data-[size=sm]:gap-3",
        // Image edge handling
        "has-[>img:first-child]:pt-0",
        "*:[img:first-child]:rounded-t-2xl *:[img:last-child]:rounded-b-2xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1",
        "rounded-t-2xl px-7 pt-7 pb-4",               // 28px horizontal, 28px top
        "group-data-[size=sm]/card:px-5 group-data-[size=sm]/card:pt-5 group-data-[size=sm]/card:pb-3",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        "has-data-[slot=card-description]:grid-rows-[auto_auto]",
        "[.border-b]:pb-5 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        // Sahara: headings use EB Garamond
        "font-heading text-[1.125rem] leading-snug font-semibold text-[#2c1f14]",
        "group-data-[size=sm]/card:text-base",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground font-sans", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-7 pb-2",    // 28px horizontal — Sahara generous padding
        "group-data-[size=sm]/card:px-5",
        className
      )}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-2xl",
        "border-t border-[rgba(216,208,200,0.60)]",
        "bg-[#f5ede2]/60",   // very subtle warm tint, not grey
        "px-7 py-4",
        "group-data-[size=sm]/card:px-5 group-data-[size=sm]/card:py-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
