type UtilityIconName = 'GitHub' | 'LinkedIn' | 'email' | 'pause' | 'play';

export function UtilityIcon({ name }: { name: UtilityIconName }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="currentColor">
      {name === 'GitHub' && <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.75c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />}
      {name === 'LinkedIn' && <><circle cx="5" cy="5" r="2" /><path d="M3.3 9h3.4v12H3.3zM10 9h3.3v1.6c.7-1.1 1.8-1.9 3.5-1.9 3.5 0 4.2 2.2 4.2 5V21h-3.4v-6.5c0-1.6-.3-2.8-1.9-2.8-1.8 0-2.3 1.3-2.3 3V21H10z" /></>}
      {name === 'email' && <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 6 9 7 9-7" /></g>}
      {name === 'pause' && <><path d="M7 5h3v14H7zM14 5h3v14h-3z" /></>}
      {name === 'play' && <path d="m8 4 12 8-12 8z" />}
    </svg>
  );
}
