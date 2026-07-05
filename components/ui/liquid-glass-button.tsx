"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const liquidbuttonVariants = cva(
  "inline-flex items-center transition-all justify-center cursor-pointer gap-2 whitespace-nowrap rounded-lg text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-primary/80 via-primary to-primary/95 text-primary-foreground hover:scale-[1.02] duration-300",
        emerald: "bg-gradient-to-b from-emerald-500/80 via-emerald-500 to-emerald-600/95 text-white hover:scale-[1.02] duration-300",
        amber: "bg-gradient-to-b from-amber-500/80 via-amber-500 to-amber-600/95 text-white hover:scale-[1.02] duration-300",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        transparent: "bg-transparent text-primary hover:scale-[1.02] duration-300",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 text-xs gap-1.5 px-4 has-[>svg]:px-4",
        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-lg px-8 has-[>svg]:px-6",
        xxl: "h-14 rounded-lg px-10 has-[>svg]:px-8",
        icon: "size-9",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)]",
        "icon-lg": "size-10",
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
}: React.ComponentProps<"button"> & React.ComponentProps<"a"> &
  VariantProps<typeof liquidbuttonVariants> & {
    asChild?: boolean
    href?: string
  }) {
  const Comp = href ? "a" : "button" as any

  return (
    <>
      <Comp
        data-slot="button"
        className={cn(
          "relative",
          liquidbuttonVariants({ variant, size, className })
        )}
        {...props}
      >
        <div className="absolute top-0 left-0 z-0 h-full w-full rounded-[inherit] 
            shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(255,255,255,0.4),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.2),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.3),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.2),inset_0_0_6px_6px_rgba(0,0,0,0.05),inset_0_0_2px_2px_rgba(255,255,255,0.1),0_0_12px_rgba(255,255,255,0.15)] 
        transition-all" />
        <div
          className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-[inherit]"
          style={{ backdropFilter: 'url("#container-glass")' }}
        />

        <div className="pointer-events-none z-10 flex items-center justify-center gap-[inherit]">
          {children}
        </div>
        <GlassFilter />
      </Comp>
    </>
  )
}

function GlassFilter() {
  return (
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
          {/* Generate turbulent noise for distortion */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves="1"
            seed="1"
            result="turbulence"
          />

          {/* Blur the turbulence pattern slightly */}
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />

          {/* Displace the source graphic with the noise */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />

          {/* Apply overall blur on the final result */}
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />

          {/* Output the result */}
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

export { LiquidButton, liquidbuttonVariants }
