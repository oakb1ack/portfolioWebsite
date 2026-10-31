import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { animate } from 'motion/mini';
import { normalizedPath } from '../data/routes';

function currentPath() {
  return normalizedPath(window.location.pathname);
}

export type ChapterPhase = 'idle' | 'covering' | 'covered' | 'revealing';

// Keep the shared artwork and audio mounted while a curtain covers route changes.
export function useChapterNavigation() {
  const [path, setPath] = useState(currentPath);
  const [phase, setPhase] = useState<ChapterPhase>('idle');
  const [destination, setDestination] = useState(path);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const curtain = useRef<HTMLDivElement>(null);
  const target = useRef(path);
  const generation = useRef(0);
  const animation = useRef<ReturnType<typeof animate> | null>(null);

  const changePage = useCallback(async (next: string) => {
    const run = ++generation.current;
    const source = target.current;
    target.current = next;
    setDestination(next);
    const element = curtain.current;
    // Capture the rendered position before stopping an interrupted wipe.
    const interruptedTransform = animation.current && element
      ? window.getComputedStyle(element).transform : null;
    animation.current?.stop();
    animation.current = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const commit = () => {
      flushSync(() => setPath(next));
      window.scrollTo(0, 0);
    };

    if (!element || reduced || document.hidden) {
      if (element) element.style.visibility = 'hidden';
      setPhase('idle');
      commit();
      return;
    }

    const backwards = next === '/' || (next === '/blog' && source.startsWith('/blog/'));
    setDirection(backwards ? 'backward' : 'forward');
    setPhase('covering');
    const start = interruptedTransform ?? (backwards ? 'translateX(110%)' : 'translateX(-110%)');
    const end = backwards ? 'translateX(-110%)' : 'translateX(110%)';
    element.style.transform = start;
    element.style.visibility = 'visible';

    try {
      animation.current = animate(element, { transform: [start, 'translateX(0%)'] }, {
        duration: interruptedTransform ? 0.14 : 0.28, ease: [0.65, 0, 0.35, 1],
      });
      await animation.current;
      if (run !== generation.current) return;

      // Commit beneath the opaque center, before the reveal starts.
      flushSync(() => {
        setPhase('covered');
        setPath(next);
      });
      window.scrollTo(0, 0);
      // Let the chapter crest settle while the new content enters underneath.
      animation.current = animate(element, { transform: ['translateX(0%)', 'translateX(0%)'] }, { duration: 0.18 });
      await animation.current;
      if (run !== generation.current) return;
      setPhase('revealing');
      animation.current = animate(element, { transform: ['translateX(0%)', end] }, {
        duration: 0.36, ease: [0.55, 0, 0.2, 1],
      });
      await animation.current;
    } catch {
      if (run === generation.current) commit();
    } finally {
      if (run === generation.current) {
        // Even an unavailable animation must leave navigation usable.
        element.style.visibility = 'hidden';
        animation.current = null;
        setPhase('idle');
      }
    }
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      const next = currentPath();
      // Anchor history stays within the article and keeps native scrolling.
      if (next !== target.current) void changePage(next);
    };
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finishTransition = () => {
      if (!animation.current) return false;
      ++generation.current;
      animation.current?.stop();
      animation.current = null;
      if (curtain.current) curtain.current.style.visibility = 'hidden';
      setPath(target.current);
      setPhase('idle');
      window.scrollTo(0, 0);
      return true;
    };
    const skipAnimation = () => {
      if (document.hidden || preference.matches) finishTransition();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && finishTransition()) event.preventDefault();
    };
    window.addEventListener('popstate', syncRoute);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', skipAnimation);
    preference.addEventListener('change', skipAnimation);
    return () => {
      ++generation.current;
      animation.current?.stop();
      window.removeEventListener('popstate', syncRoute);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', skipAnimation);
      preference.removeEventListener('change', skipAnimation);
    };
  }, [changePage]);

  const goTo = (href: string) => {
    const next = normalizedPath(href);
    if (next === target.current) return;
    window.history.pushState(null, '', href);
    void changePage(next);
  };

  return { path, phase, direction, destination, curtain, goTo };
}
