"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type GlassBoxSize = "sm" | "md" | "lg" | "xl" | "full"

const SIZE_MAP: Record<GlassBoxSize, string> = {
  sm:   "max-w-sm",
  md:   "max-w-md",
  lg:   "max-w-lg",
  xl:   "max-w-2xl",
  full: "max-w-full",
}

interface LiquidGlassBoxProps extends React.ComponentProps<"div"> {
  /** When true, renders as a fixed full-screen overlay with centered content */
  modal?: boolean
  /** Controls the max-width of the glass box content */
  size?: GlassBoxSize
  /** Called when the backdrop is clicked (modal mode only) */
  onBackdropClick?: () => void
}

function LiquidGlassBox({
  className,
  children,
  modal = false,
  size = "full",
  onBackdropClick,
  ...props
}: LiquidGlassBoxProps) {
  const filterId = React.useId().replace(/:/g, "")

  // Close on Escape key in modal mode
  React.useEffect(() => {
    if (!modal || !onBackdropClick) return
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onBackdropClick!()
    }
    document.addEventListener("keydown", handler)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handler)
      document.body.style.overflow = ""
    }
  }, [modal, onBackdropClick])

  const box = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "border border-white/10",
        "shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.08)]",
        modal && SIZE_MAP[size],
        modal && "w-full",
        className
      )}
      {...props}
    >
      {/* Bevel / inner highlight layer */}
      <div
        className="absolute top-0 left-0 z-0 h-full w-full rounded-[inherit]
          shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(255,255,255,0.4),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.2),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.3),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.2),inset_0_0_6px_6px_rgba(0,0,0,0.05),inset_0_0_2px_2px_rgba(255,255,255,0.1),0_0_12px_rgba(255,255,255,0.15)]
        transition-all pointer-events-none"
      />

      {/* Backdrop blur glass layer */}
      <div
        className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-[inherit] bg-gradient-to-b from-white/5 via-white/[0.03] to-transparent"
        style={{ backdropFilter: `url("#glass-box-${filterId}") blur(24px)` }}
      />

      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>

      {/* SVG glass filter — unique per instance */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden>
        <defs>
          <filter
            id={`glass-box-${filterId}`}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04 0.04"
              numOctaves="1"
              seed="2"
              result="turbulence"
            />
            <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blurredNoise"
              scale="50"
              xChannelSelector="R"
              yChannelSelector="B"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="3" result="finalBlur" />
            <feComposite in="finalBlur" in2="finalBlur" operator="over" />
          </filter>
        </defs>
      </svg>
    </div>
  )

  if (!modal) return box

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Box — stop propagation so clicks inside don't close the modal */}
      <div
        className={cn("relative", SIZE_MAP[size], "w-full max-h-[92dvh] overflow-y-auto")}
        onClick={(e) => e.stopPropagation()}
      >
        {box}
      </div>
    </div>
  )
}

export { LiquidGlassBox }
