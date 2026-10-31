import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { animate } from 'motion/mini';
import type { Region } from '../data/artwork';
import type { ChapterPhase } from './useChapterNavigation';

export function useRegionTravel() {
  const [region, setRegion] = useState<Region>('house');
  const [destination, setDestination] = useState<Region>('house');
  const [phase, setPhase] = useState<ChapterPhase>('idle');
  const curtain = useRef<HTMLDivElement>(null);
  const animation = useRef<ReturnType<typeof animate> | null>(null);
  const target = useRef<Region>('house');
  const trigger = useRef<HTMLButtonElement | null>(null);
  const busy = useRef(false);
  const generation = useRef(0);

  const finish = useCallback(() => {
    if (!busy.current) return;
    ++generation.current;
    animation.current?.stop();
    animation.current = null;
    if (curtain.current) curtain.current.style.visibility = 'hidden';
    setRegion(target.current);
    setPhase('idle');
    busy.current = false;
  }, []);

  useEffect(() => {
    if (phase === 'idle') trigger.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const skip = () => { if (preference.matches || document.hidden) finish(); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && busy.current) {
        event.preventDefault();
        finish();
      }
    };
    preference.addEventListener('change', skip);
    document.addEventListener('visibilitychange', skip);
    document.addEventListener('keydown', escape);
    return () => {
      ++generation.current;
      animation.current?.stop();
      preference.removeEventListener('change', skip);
      document.removeEventListener('visibilitychange', skip);
      document.removeEventListener('keydown', escape);
    };
  }, [finish]);

  const travel = async (next: Region, button: HTMLButtonElement) => {
    if (busy.current || next === target.current) return;
    target.current = next;
    trigger.current = button;
    setDestination(next);
    const element = curtain.current;
    if (!element || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRegion(next);
      return;
    }
    busy.current = true;
    const run = ++generation.current;
    const entering = next === 'tartarus';
    const start = `translateX(${entering ? '-110%' : '110%'})`;
    const end = `translateX(${entering ? '110%' : '-110%'})`;
    setPhase('covering');
    element.style.transform = start;
    element.style.visibility = 'visible';
    try {
      animation.current = animate(element, { transform: [start, 'translateX(0%)'] }, { duration: .3, ease: [.7, 0, .3, 1] });
      await animation.current;
      if (run !== generation.current) return;
      flushSync(() => { setRegion(next); setPhase('covered'); });
      animation.current = animate(element, { opacity: [1, 1] }, { duration: .24 });
      await animation.current;
      if (run !== generation.current) return;
      setPhase('revealing');
      animation.current = animate(element, { transform: ['translateX(0%)', end] }, { duration: .38, ease: [.55, 0, .2, 1] });
      await animation.current;
    } catch {
      // Missing animation support must still deliver the requested region.
    } finally {
      if (run === generation.current) finish();
    }
  };

  return { region, destination, phase, curtain, finish, travel };
}
