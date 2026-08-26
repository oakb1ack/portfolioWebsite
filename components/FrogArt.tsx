type FrogArtProps = {
  className?: string;
};

export function FrogMark({ className }: FrogArtProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.4 30c-3.4-3.1-4-8.1-1.4-12 1.2-1.8 2.8-3.2 4.8-4.1a8.2 8.2 0 0 1-.6-3.2C11.2 6.4 14.5 3 18.5 3c2.5 0 4.7 1.4 5.9 3.6C25.7 4.4 28 3 30.5 3c4 0 7.3 3.4 7.3 7.7 0 1.1-.2 2.2-.6 3.2 2 .9 3.6 2.3 4.8 4.1 2.6 3.9 2 8.9-1.4 12-6.6 4.2-25.6 4.2-32.2 0Z"
        fill="var(--color-leaf-100)"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="18.5" cy="10.5" r="2" fill="var(--color-ink)" />
      <circle cx="30.5" cy="10.5" r="2" fill="var(--color-ink)" />
      <circle cx="21.5" cy="18" r="0.8" fill="currentColor" />
      <circle cx="27.5" cy="18" r="0.8" fill="currentColor" />
      <path
        d="M16.5 23.5c4.6 3.1 11.4 3.1 16 0"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}
