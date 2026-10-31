import { useEffect, useRef } from 'react';
import type { ChapterPhase } from '../hooks/useChapterNavigation';

export function TransitionSound({ enabled, phase }: { enabled: boolean; phase: ChapterPhase }) {
  const audio = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const player = audio.current;
    if (!player) return;
    if (!enabled || phase === 'idle') {
      player.pause();
      return;
    }
    if (phase !== 'covering') return;
    player.volume = 0.22;
    player.currentTime = 0;
    // A blocked or unavailable effect must never delay navigation.
    void player.play().catch(() => {});
  }, [enabled, phase]);

  useEffect(() => {
    const player = audio.current;
    return () => player?.pause();
  }, []);

  return <audio ref={audio} src="/sounds/chapter-whoosh.mp3" preload="none" data-transition-sound="" />;
}
