"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const liquidbuttonVariants = cva(
  "inline-flex items-center group transition-all justify-center cursor-pointer gap-2 whitespace-nowrap rounded-[14px] text-sm font-bold disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95 shadow-sm",
  {
    variants: {
      variant: {
        // ── Matte Glassy Dynamic Island Variant ───────────────────────────
        default:
          "bg-[rgba(62,15,58,0.75)] dark:bg-white/15 text-white border border-[rgba(255,255,255,0.2)] backdrop-blur-xl hover:bg-[rgba(62,15,58,0.85)] dark:hover:bg-white/25 shadow-md hover:shadow-lg",
        emerald:
          "bg-emerald-700/75 dark:bg-emerald-500/25 text-white border border-[rgba(255,255,255,0.2)] backdrop-blur-xl hover:bg-emerald-700/85 dark:hover:bg-emerald-500/35 shadow-md",
        amber:
          "bg-amber-600/75 dark:bg-amber-500/25 text-white border border-[rgba(255,255,255,0.2)] backdrop-blur-xl hover:bg-amber-600/85 dark:hover:bg-amber-500/35 shadow-md",
        orange:
          "bg-[rgba(62,15,58,0.75)] dark:bg-white/15 text-white border border-[rgba(255,255,255,0.2)] backdrop-blur-xl hover:bg-[rgba(62,15,58,0.85)] dark:hover:bg-white/25 shadow-md hover:shadow-lg",
        danger:
          "bg-red-700/75 dark:bg-red-500/25 text-white border border-[rgba(255,255,255,0.2)] backdrop-blur-xl hover:bg-red-700/85 dark:hover:bg-red-500/35 shadow-md",
        destructive:
          "bg-red-700/75 dark:bg-red-500/25 text-white border border-[rgba(255,255,255,0.2)] backdrop-blur-xl hover:bg-red-700/85 dark:hover:bg-red-500/35 shadow-md",

        // ── Mapped to Matte Glassy for maximum visibility across the app ───────
        "glass-light":
          "bg-[rgba(62,15,58,0.75)] dark:bg-white/15 text-white border border-[rgba(255,255,255,0.2)] backdrop-blur-xl hover:bg-[rgba(62,15,58,0.85)] dark:hover:bg-white/25 shadow-md hover:shadow-lg",
        secondary:
          "bg-[rgba(62,15,58,0.75)] dark:bg-white/15 text-white border border-[rgba(255,255,255,0.2)] backdrop-blur-xl hover:bg-[rgba(62,15,58,0.85)] dark:hover:bg-white/25 shadow-md hover:shadow-lg",

        // ── Transparent / Alt variants ─────────────────────────────────────
        "glass-dark":
          "bg-white/10 hover:bg-white/15 border border-white/20 text-white backdrop-blur-xl shadow-md",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
        ghost:
          "hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent-foreground shadow-none",
        link:
          "text-primary underline-offset-4 hover:underline shadow-none",
        transparent:
          "bg-transparent text-primary hover:scale-[1.02] shadow-none",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 text-xs gap-1.5 px-4",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-base",
        xxl: "h-16 rounded-2xl px-12 text-lg",
        icon: "size-10",
        "icon-sm": "size-8 rounded-[10px]",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  href,
  children,
  ...props
}: React.ComponentProps<"button"> &
  React.ComponentProps<"a"> &
  VariantProps<typeof liquidbuttonVariants> & {
    asChild?: boolean
    href?: string
  }) {
  const Comp = href ? "a" : ("button" as any)

  return (
    <Comp
      data-slot="button"
      className={cn("relative overflow-hidden", liquidbuttonVariants({ variant, size, className }))}
      href={href}
      {...props}
    >
      <div className="pointer-events-none relative z-10 flex items-center justify-center gap-[inherit]">
        {children}
      </div>
    </Comp>
  )
}

export { LiquidButton, liquidbuttonVariants }
