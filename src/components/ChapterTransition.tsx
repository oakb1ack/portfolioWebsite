import type { RefObject } from 'react';
import { pageFor } from '../data/routes';
import type { ChapterPhase } from '../hooks/useChapterNavigation';
import { chapterCrests } from '../data/chapterCrests';

const chapterTitles = {
  home: 'The House',
  about: 'About',
  experience: 'Experience',
  blog: 'Blog',
  'not-found': 'Uncharted',
} as const;

function ChapterSigil({ page }: { page: ReturnType<typeof pageFor> }) {
  // Markup comes only from our checked-in Paper.js exports.
  return <span className="chapter-sigil" dangerouslySetInnerHTML={{ __html: chapterCrests[page] }} />;
}

export function ChapterTransition({ curtainRef, phase, direction, destination, articleTitle }: {
  curtainRef: RefObject<HTMLDivElement | null>;
  phase: ChapterPhase;
  direction: 'forward' | 'backward';
  destination: string;
  articleTitle?: string;
}) {
  const page = pageFor(destination);
  return <>
    <div ref={curtainRef} className="chapter-curtain" aria-hidden="true" data-phase={phase} data-direction={direction}>
      <span className="chapter-curtain-edge chapter-curtain-edge-left" />
      <span className="chapter-curtain-edge chapter-curtain-edge-right" />
    </div>
    <div className="chapter-interlude" data-phase={phase} aria-hidden="true">
      <div className="chapter-interlude-card" key={destination}>
        <ChapterSigil page={page} />
        <span className="chapter-interlude-title">{articleTitle ?? chapterTitles[page]}</span>
      </div>
    </div>
  </>;
}
