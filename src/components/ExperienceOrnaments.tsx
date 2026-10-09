export function CodexDivider() {
  return (
    <div className="experience-rule" aria-hidden="true">
      <svg viewBox="0 0 104 36" fill="none" focusable="false">
        <path d="M2 18H30L38 10H44M102 18H74L66 10H60M26 24H36L42 30H62L68 24H78" stroke="currentColor" strokeWidth="1.5" />
        <path d="M52 3L67 18L52 33L37 18Z" fill="#111911" stroke="currentColor" strokeWidth="1.5" />
        <path d="M52 10L60 18L52 26L44 18Z" fill="currentColor" />
        <path d="M10 14L14 18L10 22L6 18ZM94 14L98 18L94 22L90 18Z" fill="currentColor" />
      </svg>
    </div>
  );
}

export function RecordCorners() {
  return (
    <>
      {['top', 'bottom'].map(corner => (
        <svg key={corner} className={`experience-corner experience-corner-${corner}`} viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
          <path d="M3 5H43V45M12 13H35V36H25V23H18M3 9H9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ))}
    </>
  );
}

export function StatusSigil() {
  return (
    <svg className="experience-status-sigil" viewBox="0 0 16 20" fill="none" aria-hidden="true" focusable="false">
      <path d="M8 1L15 10L8 19L1 10Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 6L11 10L8 14L5 10Z" fill="currentColor" />
    </svg>
  );
}
