export function SeamlessPattern({
  className = '',
  opacity = 0.1,
}: {
  className?: string
  opacity?: number
}) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="indian-pattern"
            x="0"
            y="0"
            width="200"
            height="200"
            patternUnits="userSpaceOnUse"
          >
            {/* Taj Mahal - top left */}
            <g transform="translate(10, 10) scale(0.6)" className="fill-primary">
              <path d="M50 8c-1 0-2 12-2 12l-6 14h-8l-4-8h-4l2 8h-6l-2 10h60l-2-10h-6l2-8h-4l-4 8h-8l-6-14s-1-12-2-12zM20 46v6h60v-6H20zm-4 8v4h68v-4H16zm-2 6v4h72v-4H14zm-2 6v4h76v-4H12zm0 6v2h76v-2H12zm-4 4v6h84v-6H8z" />
              <circle cx="50" cy="22" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
            </g>

            {/* Elephant - center right */}
            <g transform="translate(110, 80) scale(0.7)" className="fill-accent">
              <path d="M75 30c0-8-6-14-14-16-4-1-10 0-14 3-6-4-14-5-20-1-8 5-12 16-10 26l2 8-4 6v16h8v-10l4-4 8 2 6 12h8l-2-14 6-2 6 14h8V55l-2-6 4-6c2-4 4-10 4-13z" />
            </g>

            {/* Lotus - bottom left */}
            <g transform="translate(20, 120) scale(0.6)" className="fill-[#138808]">
              <path d="M50 20c-8 15-20 28-20 40 0 8 6 14 12 16 2-6 5-10 8-12 3 2 6 6 8 12 6-2 12-8 12-16 0-12-12-25-20-40z" />
              <path d="M30 55c-12 2-20 10-20 18 2 2 6 4 10 3 4-2 8-10 10-21z" opacity="0.8" />
              <path d="M70 55c12 2 20 10 20 18-2 2-6 4-10 3-4-2-8-10-10-21z" opacity="0.8" />
            </g>

            {/* Om - top right */}
            <g transform="translate(130, 10) scale(0.5)" className="fill-primary">
              <path d="M35 70c-10-2-18-12-16-24 1-8 8-14 16-14 6 0 12 4 14 10l4-2c-4-8-12-14-20-13-12 1-21 12-20 24 1 10 8 18 16 22l6-3zm20-30c0-6 4-10 8-10s8 4 8 10c0 8-6 14-12 18l2 4c8-4 16-12 16-22 0-10-6-18-14-18s-14 8-14 18c0 4 2 8 4 10l4-2c-2-2-2-4-2-8zm10 20c-4 4-10 8-14 8-6 0-8-4-8-8l-4 2c0 6 4 12 12 12 6 0 12-4 16-10l-2-4z" />
              <circle cx="58" cy="18" r="4" />
            </g>

            {/* Diya - center */}
            <g transform="translate(60, 60) scale(0.5)" className="fill-accent">
              <path d="M50 15c-2 0-4 6-4 6l-2 8c4 2 8 2 12 0l-2-8s-2-6-4-6z" opacity="0.8" />
              <ellipse cx="50" cy="50" rx="30" ry="12" />
              <path d="M20 50c0 12 8 20 30 24s30-12 30-24" />
            </g>

            {/* Paisley - bottom right */}
            <g transform="translate(140, 130) scale(0.6)" className="fill-[#138808]">
              <path d="M30 10c-20 10-25 40-15 60 8 16 25 20 30 10 6-12-2-30-15-40" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#indian-pattern)" />
      </svg>
    </div>
  )
}
