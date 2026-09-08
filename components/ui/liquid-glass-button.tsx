"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const liquidbuttonVariants = cva(
  "inline-flex items-center group transition-all justify-center cursor-pointer gap-2 whitespace-nowrap rounded-[14px] text-sm font-bold disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.15)]",
  {
    variants: {
      variant: {
        // ── iOS Glossy Orange Variant (Default) ───────────────────────────
        default:
          "bg-gradient-to-b from-[#ff8c00] to-[#e64d00] text-white border border-[#cc4400]",
        emerald:
          "bg-gradient-to-b from-[#34d399] to-[#059669] text-white border border-[#047857]",
        amber:
          "bg-gradient-to-b from-[#fbbf24] to-[#d97706] text-white border border-[#b45309]",
        orange:
          "bg-gradient-to-b from-[#ff8c00] to-[#e64d00] text-white border border-[#cc4400]",
        danger:
          "bg-gradient-to-b from-[#f87171] to-[#dc2626] text-white border border-[#b91c1c]",
        destructive:
          "bg-gradient-to-b from-[#f87171] to-[#dc2626] text-white border border-[#b91c1c]",

        // ── Mapped to Orange for maximum visibility across the app ───────
        "glass-light":
          "bg-gradient-to-b from-[#ff8c00] to-[#e64d00] text-white border border-[#cc4400]",
        secondary:
          "bg-gradient-to-b from-[#ff8c00] to-[#e64d00] text-white border border-[#cc4400]",

        // ── Transparent / Alt variants ─────────────────────────────────────
        "glass-dark":
          "bg-gradient-to-b from-white/20 to-white/5 border border-white/20 text-white backdrop-blur-md",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
        ghost:
          "hover:bg-black/5 hover:text-accent-foreground shadow-none",
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

const GLOSSY_VARIANTS = new Set([
  "default", "emerald", "amber", "orange", "danger",
  "glass-light", "glass-dark", "destructive", "secondary"
])

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
  const isGlossy = GLOSSY_VARIANTS.has(variant ?? "default")

  return (
    <Comp
      data-slot="button"
      className={cn("relative overflow-hidden", liquidbuttonVariants({ variant, size, className }))}
      href={href}
      {...props}
    >
      {isGlossy && (
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden">
          {/* iOS style strong top white gradient shine */}
          <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/60 to-white/0" />
          {/* Inner shadow for sharp 3D gel effect */}
          <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_2px_1px_rgba(255,255,255,0.6),inset_0_-3px_5px_rgba(0,0,0,0.3)]" />
        </div>
      )}

      {/* Children Wrapper: Drop shadow ensures text/icons pop against the bright shiny background */}
      <div className="pointer-events-none relative z-10 flex items-center justify-center gap-[inherit] drop-shadow-md">
        {children}
      </div>
    </Comp>
  )
}

export { LiquidButton, liquidbuttonVariants }
