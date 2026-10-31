import { useState } from 'react';
import { regions } from '../data/artwork';
import type { Region } from '../data/artwork';

export function ArtworkBackground({ compactControls = false, region, onTravel }: {
  compactControls?: boolean;
  region: Region;
  onTravel: (destination: Region, trigger: HTMLButtonElement) => void;
}) {
  const [ready, setReady] = useState<Partial<Record<Region, boolean>>>({});
  const [failed, setFailed] = useState<Partial<Record<Region, boolean>>>({});
  const artwork = regions[region];
  const next = region === 'house' ? 'tartarus' : 'house';
  const action = next === 'tartarus' ? 'Enter Tartarus' : 'Return to the House';
  // Resolve the current image too, so immediate travel back never disables the focused control.
  const waitingForCurrent = !ready[region] && !failed[region];

  return <>
    <div className="artwork-background region-background" aria-hidden="true">
      {(Object.keys(regions) as Region[]).map(id => <img
        key={id}
        className={`artwork-image ${region === id ? 'active' : ''}`}
        src={regions[id].src}
        alt=""
        style={{ objectPosition: regions[id].position }}
        fetchPriority={id === 'house' ? 'high' : 'low'}
        decoding="async"
        onLoad={event => {
          // Decode the destination before its reveal.
          void event.currentTarget.decode()
            .then(() => setReady(previous => ({ ...previous, [id]: true })))
            .catch(() => setFailed(previous => ({ ...previous, [id]: true })));
        }}
        onError={() => setFailed(previous => ({ ...previous, [id]: true }))}
      />)}
    </div>
    <aside className={`artwork-controls region-controls${compactControls ? ' artwork-controls-compact' : ''}`} aria-label="Underworld region">
      <button className="next-artwork region-travel" aria-label={action} disabled={waitingForCurrent || !ready[next] || failed[next]}
        onClick={event => onTravel(next, event.currentTarget)}>
        <span className="region-location">{region === 'house' ? 'The House' : 'Region I · Tartarus'}</span>
        <span className="next-artwork-label">{action} <span className="artwork-arrow" aria-hidden="true">{next === 'tartarus' ? '↓' : '↑'}</span></span>
        <span className="artwork-title">{next === 'tartarus' ? 'Descend into the depths' : 'A moment of respite'}</span>
      </button>
      {failed[next] && <p className="region-error" role="status">{regions[next].title} is unavailable. Try reloading to open the gates.</p>}
      <a className="artwork-credit" href={artwork.source} target="_blank" rel="noreferrer">{artwork.credit}</a>
    </aside>
  </>;
}
