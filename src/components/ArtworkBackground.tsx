import { artwork } from '../data/artwork';

export function ArtworkBackground({ compactControls = false }: { compactControls?: boolean }) {
  return <>
    <div className="artwork-background" aria-hidden="true">
      <img className="artwork-image active" src={artwork.src} alt=""
        style={{ objectPosition: artwork.position }} fetchPriority="high" decoding="async" />
    </div>
    <aside className={`artwork-controls${compactControls ? ' artwork-controls-compact' : ''}`} aria-label="Background artwork">
      <p className="artwork-location">{artwork.title}</p>
      <a className="artwork-credit" href={artwork.source} target="_blank" rel="noreferrer">{artwork.credit}</a>
    </aside>
  </>;
}
