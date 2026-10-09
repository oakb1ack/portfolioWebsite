import { useId } from 'react';

export function CrimsonBranch() {
  return (
    <svg className="dialogue-branch" viewBox="0 0 70 126" fill="none" aria-hidden="true">
      <path d="M32 117C20 83 26 48 52 13" stroke="#0b100b" strokeWidth="9" />
      <g stroke="#0b100b" strokeWidth="3" strokeLinejoin="round">
        <path d="M32 103C10 96 8 82 5 67C21 72 29 82 32 103Z" fill="#a83423" />
        <path d="M29 86C39 63 50 62 62 57C59 75 47 85 29 86Z" fill="#d24829" />
        <path d="M29 74C11 65 12 51 11 37C26 47 31 58 29 74Z" fill="#bc3825" />
        <path d="M34 58C44 38 57 36 67 33C61 50 50 57 34 58Z" fill="#e3512c" />
        <path d="M40 45C25 34 27 21 29 9C40 20 44 32 40 45Z" fill="#cd4225" />
        <path d="M46 29C46 13 56 8 64 3C64 16 57 25 46 29Z" fill="#e35b2f" />
        <path d="M33 108C42 97 50 96 58 96C52 107 43 111 33 108Z" fill="#ac3a25" />
      </g>
      <path d="M32 117C23 84 29 49 52 13" stroke="#e88743" strokeWidth="2" />
    </svg>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <svg className={`dialogue-corner ${className}`} viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path d="M6 63L6 17L17 6L63 6L54 14L23 14L14 23L14 54Z" fill="#b7a05a" stroke="#161c12" strokeWidth="3" />
      <path d="M17 54L17 25L25 17L54 17M24 45L24 29L29 24L45 24" stroke="#cfba78" strokeWidth="2" />
      <path d="M16 8L22 14L16 20L10 14Z" fill="#e6ce83" stroke="#282b1e" strokeWidth="2" />
    </svg>
  );
}

export function DialogueDetails() {
  const grainId = useId();
  return (
    <>
      <svg className="dialogue-paper-grain" width="100%" height="100%" aria-hidden="true">
        <defs>
          <filter id={grainId} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </svg>
      <svg className="dialogue-paper-lines" viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M780 18L764 56L775 80L750 100M764 56L738 64" />
          <path d="M18 215L44 231L52 262L90 283M44 231L37 253" />
        </g>
      </svg>
      <Corner className="dialogue-corner-top" />
      <Corner className="dialogue-corner-bottom" />
    </>
  );
}
