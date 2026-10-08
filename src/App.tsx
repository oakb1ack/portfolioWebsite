import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArtworkBackground } from './components/ArtworkBackground';
import { MusicPlayer } from './components/MusicPlayer';
import { UtilityIcon } from './components/UtilityIcon';
import { site } from './data/site';
import { music } from './data/music';

const chapters = [
  { id: 'about', label: 'About', caption: 'Meet the mortal behind the work', eyebrow: '01 / The person', title: 'A curious mortal.' },
  { id: 'experience', label: 'Experience', caption: 'A record of the journey so far', eyebrow: '02 / The journey', title: 'Experience.' },
  { id: 'blog', label: 'Blog', caption: 'Notes from the journey', eyebrow: '03 / The notebook', title: 'Notes and ideas.' },
  { id: 'contact', label: 'Contact', caption: 'Send a message from the surface', eyebrow: '04 / The connection', title: 'Reach the surface.' },
] as const;
type Chapter = (typeof chapters)[number]['id'];

export default function App() {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const activeChapter = chapters.find(item => item.id === chapter);

  useEffect(() => {
    if (chapter) {
      lastTrigger.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
    } else if (dialog.current?.open) {
      dialog.current.close();
      lastTrigger.current?.focus();
    }
  }, [chapter]);

  function moveSelection(event: KeyboardEvent<HTMLElement>) {
    const buttons = menu.current?.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>('.menu-item');
    if (!buttons) return;
    const current = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    if (event.key === 'ArrowDown') next = (current + 1) % buttons.length;
    else if (event.key === 'ArrowUp') next = (current - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[next].focus();
    setSelected(next);
  }

  return (
    <div className="title-screen">
      <ArtworkBackground />
      <div className="screen-shade" aria-hidden="true" />
      <header className="screen-header">
        <span className="version">V0.1</span>
      </header>
      <main className="main-menu">
        <div className="title-lockup">
          <h1 aria-label={site.name}>
            <span className="title-emblem" aria-hidden="true">
              <span className="logo-slice logo-top">Ali</span>
              <span className="logo-slice logo-middle">Ali</span>
              <span className="logo-slice logo-bottom">Ali</span>
            </span>
            <span className="title-surname" aria-hidden="true">Alfridawi</span>
          </h1>
          <p className="occupation">EE &amp; Math @ UTA</p>
        </div>
        <nav ref={menu} className="menu" aria-label="Portfolio menu" onKeyDown={moveSelection}>
          {chapters.map((item, index) => (
            <button key={item.id} className={`menu-item ${selected === index ? 'selected' : ''}`} onMouseEnter={() => setSelected(index)} onFocus={() => setSelected(index)} onClick={() => setChapter(item.id)}>
              <span className="menu-pointer" aria-hidden="true">»</span><span>{item.label}</span>
            </button>
          ))}
          <p className="menu-caption" aria-live="polite">{chapters[selected].caption}</p>
        </nav>
      </main>
      <footer className="screen-footer">
        <div className="footer-tools">
          {site.profiles.map(profile => <a className="utility-link" key={profile.label} href={profile.href} target="_blank" rel="noreferrer" aria-label={profile.label} title={profile.label}><UtilityIcon name={profile.label} /></a>)}
          <a className="utility-link" href={`mailto:${site.email}`} aria-label="Email Ali" title="Email Ali"><UtilityIcon name="email" /></a>
          <MusicPlayer />
        </div>
      </footer>
      <p className="screen-credits">Music: <a href={music.source} target="_blank" rel="noreferrer">{music.title} — {music.artist} (incompetech.com)</a> · <a href={music.licenseUrl} target="_blank" rel="noreferrer">{music.license}</a></p>
      <dialog ref={dialog} className="chapter-dialog" aria-labelledby="chapter-title" onCancel={() => setChapter(null)} onClose={() => setChapter(null)} onClick={event => { if (event.target === event.currentTarget) setChapter(null); }}>
        <div className="chapter-inner">
          <button autoFocus className="back-button" onClick={() => setChapter(null)}>← Return to the house <kbd>Esc</kbd></button>
          <p className="eyebrow">{activeChapter?.eyebrow}</p>
          <h2 id="chapter-title">{activeChapter?.title}</h2>
          <div className="chapter-rule" />
          {chapter === 'about' && <><p>I’m {site.name}, a mathematics and electrical engineering student at the University of Texas at Arlington.</p><p>{site.description}</p><a className="text-link" href={site.resumeHref} target="_blank" rel="noreferrer">Read my résumé <span>↗</span></a></>}
          {chapter === 'experience' && <><p>A record of my work, learning, and contributions. Details coming soon.</p><a className="text-link" href={site.resumeHref} target="_blank" rel="noreferrer">Read my résumé <span>↗</span></a></>}
          {chapter === 'blog' && <p>Thoughts on mathematics, engineering, and the things I’m learning. First posts coming soon.</p>}
          {chapter === 'contact' && <><p>Have an interesting problem, an idea, or just something to share? I’d like to hear it.</p><a className="email-link" href={`mailto:${site.email}`}>{site.email} ↗</a><div className="profile-links">{site.profiles.map(profile => <a className="text-link" href={profile.href} key={profile.label} target="_blank" rel="noreferrer">{profile.label} ↗</a>)}</div></>}
          <span className="dialog-ornament" aria-hidden="true">◆</span>
        </div>
      </dialog>
    </div>
  );
}
