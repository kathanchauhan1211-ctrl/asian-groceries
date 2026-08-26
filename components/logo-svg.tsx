// Shared logo component using the actual logo-icon.png with transparent background.
// No wrapper, no white box — renders directly on any background.
export function LogoSVG({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-icon.png"
      alt="IndianMarket logo"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ display: 'block' }}
    />
  )
}
