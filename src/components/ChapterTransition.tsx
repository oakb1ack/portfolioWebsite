import type { RefObject } from 'react';
import { pageFor } from '../data/routes';
import type { ChapterPhase } from '../hooks/useChapterNavigation';
import { chapterCrests } from '../data/chapterCrests';

const chapters = {
  home: { number: 'Return', title: 'The House', caption: 'Every journey begins here' },
  about: { number: 'Chapter I', title: 'About', caption: 'The mortal behind the work' },
  experience: { number: 'Chapter II', title: 'Experience', caption: 'A record of the journey so far' },
  blog: { number: 'Chapter III', title: 'Blog', caption: 'Notes from the journey' },
  'not-found': { number: 'Beyond the map', title: 'Uncharted', caption: 'A path yet to be discovered' },
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
  const chapter = chapters[page];
  return <>
    <div ref={curtainRef} className="chapter-curtain" aria-hidden="true" data-phase={phase} data-direction={direction}>
      <span className="chapter-curtain-edge chapter-curtain-edge-left" />
      <span className="chapter-curtain-edge chapter-curtain-edge-right" />
    </div>
    <div className="chapter-interlude" data-phase={phase} aria-hidden="true">
      <div className="chapter-interlude-card" key={destination}>
        <ChapterSigil page={page} />
        <span className="chapter-interlude-number">{articleTitle ? 'From the notebook' : chapter.number}</span>
        <span className="chapter-interlude-title">{articleTitle ?? chapter.title}</span>
        <span className="chapter-interlude-rule"><i />◆<i /></span>
        <span className="chapter-interlude-caption">{chapter.caption}</span>
      </div>
    </div>
  </>;
}
