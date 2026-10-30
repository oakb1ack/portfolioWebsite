import type { RefObject } from 'react';
import { pageFor } from '../data/routes';
import type { ChapterPhase } from '../hooks/useChapterNavigation';

const chapters = {
  home: { number: 'Return', title: 'The House', caption: 'Every journey begins here' },
  about: { number: 'Chapter I', title: 'About', caption: 'The mortal behind the work' },
  experience: { number: 'Chapter II', title: 'Experience', caption: 'A record of the journey so far' },
  blog: { number: 'Chapter III', title: 'Blog', caption: 'Notes from the journey' },
  'not-found': { number: 'Beyond the map', title: 'Uncharted', caption: 'A path yet to be discovered' },
} as const;

function ChapterSigil({ page }: { page: ReturnType<typeof pageFor> }) {
  return <svg className="chapter-sigil" viewBox="0 0 100 100" fill="none">
    <path className="chapter-sigil-frame" d="M50 3 97 50 50 97 3 50ZM50 13 87 50 50 87 13 50Z" />
    <path className="chapter-sigil-rays" d="M50 0V15M100 50H85M50 100V85M0 50H15M17 17 26 26M83 17 74 26M83 83 74 74M17 83 26 74" />
    {page === 'home' ? <>
      <path d="M30 48 50 30 70 48M35 45V70H65V45M45 70V54H55V70" />
      <path className="chapter-sigil-accent" d="M50 22 54 28 50 34 46 28Z" />
    </> : page === 'about' ? <>
      <path d="M45 74C41 58 48 38 61 26M46 64C32 64 30 55 30 55 43 54 46 64 46 64ZM47 53C35 50 35 41 35 41 48 44 47 53 47 53ZM52 42C48 30 55 26 55 26 58 36 52 42 52 42Z" />
      <path className="chapter-sigil-accent" d="M46 62C63 63 66 51 66 51 50 51 46 62 46 62ZM51 48C67 46 68 36 68 36 55 38 51 48 51 48Z" />
    </> : page === 'blog' ? <>
      <path d="M32 29H63L69 35V72H32ZM40 29V72M47 44H60M47 52H60M47 60H56" />
      <path className="chapter-sigil-accent" d="M54 29V40L58 37 62 40V29Z" />
    </> : <>
      <path d="M50 27 73 50 50 73 27 50ZM50 36 64 50 50 64 36 50Z" />
      <path className="chapter-sigil-accent" d="M50 43 57 50 50 57 43 50Z" />
    </>}
  </svg>;
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
