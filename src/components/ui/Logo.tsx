/** The Frontier mark: a square with an F drawn as one stroke. Inherits colour from the surrounding text. */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo-mark">
      <rect width="32" height="32" rx="3" fill="currentColor" />
      <path d="M21 8H11v16M11 16h8" fill="none" stroke="var(--bg)" strokeWidth="2.75" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}
