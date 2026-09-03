import React from 'react'

type PageHeroProps = {
  badge?: React.ReactNode
  title: React.ReactNode
  subtitle?: string
  className?: string
}

/**
 * Consistent page-level hero banner used across Track, Dashboard, Community, and Checkout pages.
 * Matches the site's saffron/orange design language.
 */
export function PageHero({ badge, title, subtitle, className = '' }: PageHeroProps) {
  return (
    <div className={`relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-primary/5 via-white dark:via-slate-950 to-accent/5 ${className}`}>
      {/* Decorative accent line (matches site header) */}
      <div className="h-[3px] bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {badge && (
          <div className="mb-2">{badge}</div>
        )}
        <h1 className="font-serif text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
