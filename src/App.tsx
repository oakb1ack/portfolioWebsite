import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { ArtworkBackground } from './components/ArtworkBackground';
import { MusicPlayer } from './components/MusicPlayer';
import { UtilityIcon } from './components/UtilityIcon';
import { CrimsonBranch, DialogueDetails } from './components/DialogueDetails';
import { ExperiencePage } from './components/ExperiencePage';
import { BlogPage } from './components/BlogPage';
import { posts, siteOrigin } from 'virtual:blog-posts';
import { updatePageMetadata } from './data/pageMetadata';
import { site } from './data/site';
import { music } from './data/music';

const chapters = [
  { id: 'about', label: 'About', caption: 'Meet the mortal behind the work', eyebrow: '01 / The person', title: 'A curious mortal.' },
  { id: 'experience', label: 'Experience', caption: 'A record of the journey so far', eyebrow: '02 / The journey', title: 'Experience.' },
  { id: 'blog', label: 'Blog', caption: 'Notes from the journey', eyebrow: '03 / The notebook', title: 'Notes and ideas.' },
  { id: 'contact', label: 'Contact', caption: 'Send a message from the surface', eyebrow: '04 / The connection', title: 'Reach the surface.' },
] as const;
type Chapter = 'contact';
type Page = 'home' | 'about' | 'experience' | 'blog';

function currentPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function pageFor(path: string): Page {
  return path === '/about' ? 'about' : path === '/experience' ? 'experience' : path === '/blog' || path.startsWith('/blog/') ? 'blog' : 'home';
}

export default function App() {
  const [path, setPath] = useState(currentPath);
  const page = pageFor(path);
  const isAbout = page === 'about';
  const isExperience = page === 'experience';
  const isBlog = page === 'blog';
  const isContentPage = page !== 'home';
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const pageHeading = useRef<HTMLHeadingElement>(null);
  const previousPage = useRef(page);
  const activeChapter = chapters.find(item => item.id === chapter);

  useEffect(() => {
    const syncRoute = () => {
      setChapter(null);
      setPath(currentPath());
    };
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  useEffect(() => {
    updatePageMetadata(path, posts, siteOrigin);
    if (page !== 'home') pageHeading.current?.focus({ preventScroll: true });
    else if (previousPage.current !== 'home') menu.current?.querySelector<HTMLAnchorElement>(`a[href="/${previousPage.current}"]`)?.focus({ preventScroll: true });
    previousPage.current = page;
  }, [page, path]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState(null, '', href);
    setChapter(null);
    setPath(href.replace(/\/+$/, '') || '/');
    window.scrollTo(0, 0);
  }

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
    <div className={`title-screen${isContentPage ? ' about-screen' : ''}${isExperience ? ' experience-screen' : ''}${isBlog ? ' blog-screen' : ''}`}>
      <ArtworkBackground compactControls={isContentPage} />
      <div className="screen-shade" aria-hidden="true" />
      {isAbout ? (
        <main className="about-page" key="about">
          <div className="about-navigation">
            <a className="back-button" href="/" onClick={event => navigate(event, '/')}>← Return to the house</a>
            <span className="about-page-label">About</span>
          </div>
          <article className="about-dialogue" aria-labelledby="about-name">
            <header className="about-speaker">
              <CrimsonBranch />
              <h1 id="about-name" ref={pageHeading} tabIndex={-1}>{site.name}</h1>
              <p>Mathematics &amp; Electrical Engineering</p>
            </header>
            <div className="about-dialogue-body">
              <DialogueDetails />
              <p className="about-intro">I’m Ali. I study mathematics and electrical engineering at the University of Texas at Arlington.</p>
              <p>I’m interested in how mathematical models connect to physical systems, and in building reliable software around those ideas.</p>
              <div className="about-dialogue-actions">
                <a className="about-resume" href={site.resumeHref} target="_blank" rel="noreferrer">Read my résumé <span aria-hidden="true">↗</span></a>
                <a className="about-hello" href={`mailto:${site.email}`}>Say hello <span aria-hidden="true">↗</span></a>
              </div>
            </div>
          </article>
        </main>
      ) : isExperience ? <ExperiencePage headingRef={pageHeading} onReturn={event => navigate(event, '/')} /> : isBlog ? <BlogPage posts={posts} slug={path === '/blog' ? undefined : path.slice('/blog/'.length)} headingRef={pageHeading} onNavigate={navigate} /> : <main className="main-menu page-enter" key="home">
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
            item.id !== 'contact' ? <a key={item.id} href={`/${item.id}`} className={`menu-item ${selected === index ? 'selected' : ''}`} onMouseEnter={() => setSelected(index)} onFocus={() => setSelected(index)} onClick={event => navigate(event, `/${item.id}`)}>
              <span className="menu-pointer" aria-hidden="true">»</span><span>{item.label}</span>
            </a> : <button key={item.id} className={`menu-item ${selected === index ? 'selected' : ''}`} onMouseEnter={() => setSelected(index)} onFocus={() => setSelected(index)} onClick={() => setChapter(item.id)}>
              <span className="menu-pointer" aria-hidden="true">»</span><span>{item.label}</span>
            </button>
          ))}
          <p className="menu-caption" aria-live="polite">{chapters[selected].caption}</p>
        </nav>
      </main>}
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
          {chapter === 'contact' && <><p>Have an interesting problem, an idea, or just something to share? I’d like to hear it.</p><a className="email-link" href={`mailto:${site.email}`}>{site.email} ↗</a><div className="profile-links">{site.profiles.map(profile => <a className="text-link" href={profile.href} key={profile.label} target="_blank" rel="noreferrer">{profile.label} ↗</a>)}</div></>}
          <span className="dialog-ornament" aria-hidden="true">◆</span>
        </div>
      </dialog>
    </div>
  );
}
