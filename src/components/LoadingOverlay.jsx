export default function LoadingOverlay({ isFadingOut }) {
  return <div className={`loading-overlay ${isFadingOut ? 'fade-out' : ''}`}><div className="loading-ambient" /><div className="loading-rings"><div className="loading-ring" /><div className="loading-ring" /><div className="loading-ring" /></div><div className="loading-text">Loading</div><div className="loading-progress-container"><div className="loading-progress-bar" /></div></div>;
}
