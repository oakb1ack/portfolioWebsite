import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { animate } from 'motion/mini';
import { normalizedPath } from '../data/routes';

function currentPath() {
  return normalizedPath(window.location.pathname);
}

// Keep the shared artwork and audio mounted while a curtain covers route changes.
export function useChapterNavigation() {
  const [path, setPath] = useState(currentPath);
  const [phase, setPhase] = useState<'idle' | 'covering' | 'revealing'>('idle');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const curtain = useRef<HTMLDivElement>(null);
  const target = useRef(path);
  const generation = useRef(0);
  const animation = useRef<ReturnType<typeof animate> | null>(null);

  const changePage = useCallback(async (next: string) => {
    const run = ++generation.current;
    const source = target.current;
    target.current = next;
    animation.current?.stop();
    const element = curtain.current;
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
    const start = backwards ? 'translateX(110%)' : 'translateX(-110%)';
    const end = backwards ? 'translateX(-110%)' : 'translateX(110%)';
    element.style.transform = start;
    element.style.visibility = 'visible';

    try {
      animation.current = animate(element, { transform: [start, 'translateX(0%)'] }, {
        duration: 0.26, ease: [0.65, 0, 0.35, 1],
      });
      await animation.current;
      if (run !== generation.current) return;

      // Commit beneath the opaque center, before the reveal starts.
      flushSync(() => {
        setPhase('revealing');
        setPath(next);
      });
      window.scrollTo(0, 0);
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
    const skipAnimation = () => {
      if (!animation.current || (!document.hidden && !preference.matches)) return;
      ++generation.current;
      animation.current?.stop();
      animation.current = null;
      if (curtain.current) curtain.current.style.visibility = 'hidden';
      setPath(target.current);
      setPhase('idle');
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', syncRoute);
    document.addEventListener('visibilitychange', skipAnimation);
    preference.addEventListener('change', skipAnimation);
    return () => {
      ++generation.current;
      animation.current?.stop();
      window.removeEventListener('popstate', syncRoute);
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

  return { path, phase, direction, curtain, goTo };
}
