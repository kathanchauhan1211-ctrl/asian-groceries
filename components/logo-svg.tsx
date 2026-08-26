// Shared inline SVG logo — truly transparent, no white background needed
// Usage: <LogoSVG size={32} />
export function LogoSVG({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      {/* Outer spiral arc */}
      <path
        d="M50 8 C25 8 8 25 8 50 C8 75 25 92 50 92 C75 92 92 75 92 50 C92 32 80 18 64 13"
        stroke="#E8622A"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner curl */}
      <path
        d="M50 92 C44 86 36 78 36 66 C36 55 43 48 50 48 C57 48 64 53 64 62 C64 69 59 74 52 74"
        stroke="#E8622A"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {/* Top flame petal */}
      <path
        d="M64 13 C72 4 83 2 88 6 C92 14 86 24 74 27"
        stroke="#E8622A"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Accent petal */}
      <path
        d="M68 20 C79 13 89 13 92 19 C93 28 87 36 76 36"
        stroke="#F97316"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  )
}
