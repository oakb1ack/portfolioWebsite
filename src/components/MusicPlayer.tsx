import { useEffect, useRef, useState } from 'react';
import { music } from '../data/music';

export function MusicPlayer() {
  const audio = useRef<HTMLAudioElement>(null);
  const cancelAutostart = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (audio.current) audio.current.volume = 0.25;
  }, []);

  useEffect(() => {
    const player = audio.current;
    if (!player) return;
    let cancelled = false;

    function removeInteractionListeners() {
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('keydown', startOnInteraction);
    }

    function startOnInteraction(event: Event) {
      // Music controls handle their own intent, including an explicit pause.
      if (!event.isTrusted || event.defaultPrevented ||
        (event.target instanceof Element && event.target.closest('.music-player'))) return;
      if (event instanceof KeyboardEvent && (event.ctrlKey || event.altKey || event.metaKey)) return;
      removeInteractionListeners();
      void startMusic(false);
    }

    async function startMusic(retryOnInteraction: boolean) {
      if (cancelled || !player) return;
      setLoading(true);
      try {
        await player.play();
      } catch (reason) {
        if (cancelled) return;
        if (reason instanceof DOMException && reason.name === 'NotAllowedError') {
          // Audible autoplay may need a visitor gesture; this is not a media error.
          if (retryOnInteraction) {
            document.addEventListener('click', startOnInteraction);
            document.addEventListener('keydown', startOnInteraction);
          }
        } else if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
          setError('Music could not start. Try Play music again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const cancel = () => {
      cancelled = true;
      removeInteractionListeners();
    };
    cancelAutostart.current = cancel;
    void startMusic(true);
    return () => {
      cancel();
      player.pause();
      if (cancelAutostart.current === cancel) cancelAutostart.current = null;
    };
  }, []);

  async function togglePlayback() {
    const player = audio.current;
    if (!player) return;
    cancelAutostart.current?.();
    if (!player.paused || loading) {
      player.pause();
      setLoading(false);
      return;
    }
    setError('');
    setLoading(true);
    if (player.error) player.load();
    try {
      await player.play();
    } catch (reason) {
      // Pausing while audio is loading cancels the pending play request.
      if (reason instanceof DOMException && reason.name === 'AbortError') return;
      setError('Music could not start. Try Play music again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="music-player">
      <audio
        ref={audio}
        src={music.src}
        loop
        preload="none"
        onPlaying={() => { setPlaying(true); setLoading(false); }}
        onPause={() => { setPlaying(false); setLoading(false); }}
        onWaiting={() => setLoading(true)}
        onError={() => { setPlaying(false); setLoading(false); setError('Music is unavailable. Please try again later.'); }}
      />
      <button
        className="music-toggle"
        onClick={togglePlayback}
        aria-pressed={playing || loading}
        aria-label={playing || loading ? 'Pause background music' : 'Play background music'}
      >
        <span aria-hidden="true">{playing || loading ? 'Ⅱ' : '♫'}</span>
        <span className="music-label">{loading ? 'Loading music' : playing ? 'Pause music' : 'Play music'}</span>
      </button>
      {error && <p className="music-error" role="status">{error}</p>}
    </div>
  );
}
