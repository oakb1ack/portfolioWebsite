import { useEffect, useRef, useState } from 'react';
import { music } from '../data/music';

export function MusicPlayer() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const player = audio.current;
    if (!player) return;
    player.volume = 0.25;
    return () => player.pause();
  }, []);

  async function togglePlayback() {
    const player = audio.current;
    if (!player) return;
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
