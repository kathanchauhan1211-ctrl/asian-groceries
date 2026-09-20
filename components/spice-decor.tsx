'use client'

import React from 'react'

export function SpiceDecor() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      
      {/* ── LEFT SIDE: Spices (Star Anise, Cinnamon, Chili) ── */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-[150px] sm:w-[250px] opacity-60 mix-blend-screen"
        style={{
          maskImage: 'linear-gradient(to right, black 20%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 20%, transparent 100%)',
        }}
      >
        {/* Star Anise Group */}
        <svg className="absolute -left-4 top-1/4 w-32 h-32 animate-[spin_40s_linear_infinite] text-orange-400" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 5 L58 38 L90 30 L65 52 L85 80 L50 65 L15 80 L35 52 L10 30 L42 38 Z" />
          <circle cx="50" cy="50" r="8" fill="#140308" />
        </svg>

        {/* Cinnamon Sticks */}
        <svg className="absolute left-6 bottom-1/4 w-28 h-28 -rotate-12 text-yellow-600" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M30 10 Q45 5 55 15 L75 80 Q65 95 50 85 Z" fill="currentColor" opacity="0.6" />
          <path d="M45 12 L63 80" />
          {/* Second stick */}
          <path d="M10 30 Q25 25 35 35 L55 90 Q45 105 30 95 Z" fill="currentColor" opacity="0.4" />
        </svg>

        {/* Chili Pepper */}
        <svg className="absolute left-16 top-10 w-20 h-20 rotate-45 text-red-500" viewBox="0 0 100 100" fill="currentColor">
          <path d="M80 20 Q90 40 70 60 Q40 90 20 80 Q10 75 15 65 Q35 25 60 15 Q70 10 80 20 Z" />
          <path d="M80 20 Q85 10 95 15" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* ── RIGHT SIDE: Vegetables/Herbs (Garlic, Leaf, Cardamom) ── */}
      <div 
        className="absolute top-0 bottom-0 right-0 w-[150px] sm:w-[250px] opacity-60 mix-blend-screen"
        style={{
          maskImage: 'linear-gradient(to left, black 20%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, black 20%, transparent 100%)',
        }}
      >
        {/* Garlic Bulb */}
        <svg className="absolute -right-2 top-1/3 w-28 h-28 -rotate-12 text-amber-200" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 15 C45 35 20 45 20 70 C20 85 35 95 50 95 C65 95 80 85 80 70 C80 45 55 35 50 15 Z" />
          <path d="M50 15 C50 40 35 55 35 75 C35 85 40 95 50 95 C60 95 65 85 65 75 C65 55 50 40 50 15 Z" fill="rgba(0,0,0,0.2)" />
        </svg>

        {/* Big Coriander/Curry Leaf */}
        <svg className="absolute right-12 bottom-10 w-32 h-32 rotate-[110deg] text-emerald-500" viewBox="0 0 100 100" fill="currentColor">
          <path d="M10 50 C10 20 40 10 90 10 C80 60 70 90 10 50 Z" />
          <path d="M10 50 C30 50 60 30 90 10" stroke="rgba(0,0,0,0.3)" strokeWidth="3" fill="none" />
        </svg>

        {/* Little Cardamom Pods */}
        <svg className="absolute right-20 top-10 w-16 h-16 rotate-45 text-green-400" viewBox="0 0 100 100" fill="currentColor">
          <path d="M30 20 C60 10 80 30 90 60 C60 70 40 50 30 20 Z" />
        </svg>
        <svg className="absolute right-8 top-20 w-12 h-12 -rotate-12 text-green-400" viewBox="0 0 100 100" fill="currentColor">
          <path d="M30 20 C60 10 80 30 90 60 C60 70 40 50 30 20 Z" />
        </svg>
      </div>

    </div>
  )
}
