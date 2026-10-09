import { useEffect, useState } from 'react';
import { artworks } from '../data/artwork';

export function ArtworkBackground({ compactControls = false }: { compactControls?: boolean }) {
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState<number[]>([]);
  const [requested, setRequested] = useState<number[]>([0]);
  const [failed, setFailed] = useState<number[]>([]);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const syncVisibility = () => setHidden(document.hidden);
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  // Give the opening image priority, then prepare only the next background.
  // Failed files are skipped so one missing image cannot stop navigation.
  useEffect(() => {
    if (hidden || (!loaded.includes(active) && !failed.includes(active))) return;
    let next = -1;
    for (let offset = 1; offset < artworks.length; offset++) {
      const candidate = (active + offset) % artworks.length;
      if (failed.includes(candidate)) continue;
      next = candidate;
      break;
    }
    if (next < 0 || requested.includes(next)) return;
    const timer = window.setTimeout(() => setRequested(previous => [...previous, next]), 1000);
    return () => window.clearTimeout(timer);
  }, [active, loaded, requested, failed, hidden]);

  useEffect(() => {
    if (failed.includes(active) && loaded.length) setActive(loaded[0]);
  }, [active, failed, loaded]);

  function nextArtwork() {
    for (let offset = 1; offset < artworks.length; offset++) {
      const next = (active + offset) % artworks.length;
      if (loaded.includes(next)) {
        setActive(next);
        return;
      }
    }
  }

  const artwork = artworks[active];

  return (
    <>
      <div className="artwork-background" aria-hidden="true">
        {artworks.map((art, index) => requested.includes(index) && (
          <img
            key={art.src}
            className={`artwork-image ${active === index ? 'active' : ''}`}
            src={art.src}
            alt=""
            style={{ objectPosition: art.position }}
            fetchPriority={index === 0 ? 'high' : 'low'}
            decoding="async"
            onLoad={() => setLoaded(previous => previous.includes(index) ? previous : [...previous, index])}
            onError={() => setFailed(previous => previous.includes(index) ? previous : [...previous, index])}
          />
        ))}
      </div>
      <aside
        className={`artwork-controls${compactControls ? ' artwork-controls-compact' : ''}`}
        aria-label="Background artwork"
      >
        {compactControls ? <div className="scene-control-row">
          <span className="scene-title">{artwork.title.replace('Hades · ', '')}</span>
          <button className="change-scene" onClick={nextArtwork} disabled={loaded.length < 2} aria-label="Show next background artwork">Change scene <span aria-hidden="true">→</span></button>
        </div> : <button className="next-artwork" onClick={nextArtwork} disabled={loaded.length < 2} aria-label="Show next background artwork" title={`Current artwork: ${artwork.title}`}><span className="next-artwork-label">Next artwork <span className="artwork-arrow" aria-hidden="true">→</span></span><span className="artwork-title">{artwork.title}</span></button>}
        <a className="artwork-credit" href={artwork.source} target="_blank" rel="noreferrer">{artwork.credit} ↗</a>
      </aside>
    </>
  );
}
