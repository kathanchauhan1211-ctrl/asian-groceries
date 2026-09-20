'use client'

import { useBanners, BannerConfig } from '@/lib/use-banners'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function BannerModule() {
  const { banners, loading } = useBanners()

  if (loading || !banners || banners.length === 0) return null

  // Ensure banners are rendered even if there are less than 3, but layout is best with 3.
  const mainBanner = banners.find(b => b.position === 'main') || banners[0]
  const topBanner = banners.find(b => b.position === 'secondary_top') || banners[1]
  const bottomBanner = banners.find(b => b.position === 'secondary_bottom') || banners[2]

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto lg:h-[400px]">
        {/* Main Left Banner */}
        {mainBanner && (
          <Link
            href={mainBanner.link}
            className="group relative lg:col-span-2 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col justify-center min-h-[300px] lg:min-h-0"
            style={{ backgroundColor: mainBanner.bgColor }}
          >
            {/* Background Image Overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-right bg-no-repeat transition-transform duration-700 group-hover:scale-105 opacity-90 mix-blend-luminosity" 
              style={{ backgroundImage: `url(${mainBanner.image})` }} 
            />
            {/* Gradient to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            
            <div className="relative z-10 p-8 md:p-12 flex flex-col items-start max-w-[80%] md:max-w-[60%]">
              {mainBanner.subtitle && (
                <p className="text-[11px] md:text-sm font-semibold tracking-[0.2em] mb-2 md:mb-4 uppercase" style={{ color: mainBanner.textColor, opacity: 0.8 }}>
                  {mainBanner.subtitle}
                </p>
              )}
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight mb-4" style={{ color: mainBanner.textColor }}>
                {mainBanner.title.split(' ').map((word, i) => (
                  <span key={i} className="block">{word}</span>
                ))}
              </h2>
              {mainBanner.tagline && (
                <p className="text-sm md:text-base font-medium mb-6 opacity-90" style={{ color: mainBanner.textColor }}>
                  {mainBanner.tagline}
                </p>
              )}
              <div className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors" style={{ color: mainBanner.textColor }}>
                Shop Now <ArrowRight className="size-4" />
              </div>
            </div>
          </Link>
        )}

        {/* Right Stacked Banners */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-full">
          {/* Top Secondary */}
          {topBanner && (
            <Link
              href={topBanner.link}
              className="group relative flex-1 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl flex items-center min-h-[190px]"
              style={{ backgroundColor: topBanner.bgColor }}
            >
               {/* Background Image */}
              <div 
                className="absolute inset-y-0 right-0 w-[60%] bg-cover bg-left bg-no-repeat transition-transform duration-700 group-hover:scale-105" 
                style={{ backgroundImage: `url(${topBanner.image})` }} 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent sm:from-transparent sm:bg-none" />
              <div className="relative z-10 p-6 flex flex-col items-start w-full sm:w-[60%]">
                <h3 className="text-2xl md:text-3xl font-black leading-tight tracking-tight mb-1" style={{ color: topBanner.textColor }}>
                  {topBanner.title.split(' ').map((word, i) => (
                    <span key={i} className="block">{word}</span>
                  ))}
                </h3>
                {topBanner.subtitle && (
                  <p className="text-sm font-medium tracking-wide uppercase opacity-90" style={{ color: topBanner.textColor }}>
                    {topBanner.subtitle}
                  </p>
                )}
              </div>
            </Link>
          )}

          {/* Bottom Secondary */}
          {bottomBanner && (
            <Link
              href={bottomBanner.link}
              className="group relative flex-1 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl flex items-center min-h-[190px]"
              style={{ backgroundColor: bottomBanner.bgColor }}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-y-0 right-0 w-[60%] bg-cover bg-left bg-no-repeat transition-transform duration-700 group-hover:scale-105" 
                style={{ backgroundImage: `url(${bottomBanner.image})` }} 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent sm:from-transparent sm:bg-none" />
              <div className="relative z-10 p-6 flex flex-col items-start w-full sm:w-[60%]">
                <h3 className="text-2xl md:text-3xl font-black leading-tight tracking-tight mb-2" style={{ color: bottomBanner.textColor }}>
                  {bottomBanner.title.split(' ').map((word, i) => (
                    <span key={i} className="block">{word}</span>
                  ))}
                </h3>
                {bottomBanner.tagline && (
                  <p className="text-xs font-medium opacity-90 mb-1" style={{ color: bottomBanner.textColor }}>
                    {bottomBanner.tagline}
                  </p>
                )}
                {bottomBanner.subtitle && (
                  <p className="text-[10px] uppercase tracking-wider font-bold opacity-75" style={{ color: bottomBanner.textColor }}>
                    {bottomBanner.subtitle}
                  </p>
                )}
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
