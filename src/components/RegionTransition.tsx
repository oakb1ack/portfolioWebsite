import type { RefObject } from 'react';
import { regions } from '../data/artwork';
import type { Region } from '../data/artwork';
import type { ChapterPhase } from '../hooks/useChapterNavigation';

export function RegionTransition({ curtainRef, phase, destination }: {
  curtainRef: RefObject<HTMLDivElement | null>;
  phase: ChapterPhase;
  destination: Region;
}) {
  return <>
    <div ref={curtainRef} className="region-curtain" data-phase={phase} data-destination={destination} aria-hidden="true">
      <span className="region-stone region-stone-left" />
      <span className="region-stone region-stone-right" />
    </div>
    <div className="region-interlude" data-phase={phase} aria-hidden="true">
      <div className="region-interlude-card">
        <span className="region-interlude-label">{destination === 'tartarus' ? 'Region I' : 'Sanctuary'}</span>
        <svg className="region-sigil" viewBox="0 0 100 100" fill="none">
          <path d="M50 5 88 28v44L50 95 12 72V28Z" stroke="currentColor" strokeWidth="2" />
          <path d="M29 73V42l21-16 21 16v31H59V45L50 38l-9 7v28Z" fill="currentColor" />
          <path d="M50 49v33M44 76l6 6 6-6M22 36v27M78 36v27" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span className="region-interlude-title">{regions[destination].title}</span>
        <span className="region-interlude-subtitle">{regions[destination].subtitle}</span>
      </div>
    </div>
  </>;
}
