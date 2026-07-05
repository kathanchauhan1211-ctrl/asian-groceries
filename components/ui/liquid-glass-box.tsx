"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function LiquidGlassBox({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl", className)}
      {...props}
    >
      <div className="absolute top-0 left-0 z-0 h-full w-full rounded-[inherit] 
          shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(255,255,255,0.4),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.2),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.3),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.2),inset_0_0_6px_6px_rgba(0,0,0,0.05),inset_0_0_2px_2px_rgba(255,255,255,0.1),0_0_12px_rgba(255,255,255,0.15)] 
      transition-all" />
      <div
        className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-[inherit] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
        style={{ backdropFilter: 'url("#container-glass")' }}
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter
            id="container-glass"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.05 0.05"
              numOctaves="1"
              seed="1"
              result="turbulence"
            />
            <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blurredNoise"
              scale="70"
              xChannelSelector="R"
              yChannelSelector="B"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
            <feComposite in="finalBlur" in2="finalBlur" operator="over" />
          </filter>
        </defs>
      </svg>
    </div>
  )
}

export { LiquidGlassBox }
