import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { ArtworkBackground } from './components/ArtworkBackground';
import { MusicPlayer } from './components/MusicPlayer';
import { UtilityIcon } from './components/UtilityIcon';
import { CrimsonBranch, DialogueDetails } from './components/DialogueDetails';
import { ExperiencePage } from './components/ExperiencePage';
import { BlogPage } from './components/BlogPage';
import { NotFoundPage } from './components/NotFoundPage';
import { posts, siteOrigin } from 'virtual:blog-posts';
import { updatePageMetadata } from './data/pageMetadata';
import { site } from './data/site';
import { music } from './data/music';
import { normalizedPath, pageFor } from './data/routes';

const chapters = [
  { id: 'about', label: 'About', caption: 'Meet the mortal behind the work' },
  { id: 'experience', label: 'Experience', caption: 'A record of the journey so far' },
  { id: 'blog', label: 'Blog', caption: 'Notes from the journey' },
] as const;
function currentPath() {
  return normalizedPath(window.location.pathname);
}

export default function App() {
  const [path, setPath] = useState(currentPath);
  const page = pageFor(path);
  const isAbout = page === 'about';
  const isExperience = page === 'experience';
  const isBlog = page === 'blog';
  const isMissing = page === 'not-found';
  const isContentPage = page !== 'home';
  const [selected, setSelected] = useState(0);
  const menu = useRef<HTMLElement>(null);
  const pageHeading = useRef<HTMLHeadingElement>(null);
  const previousPage = useRef(page);

  useEffect(() => {
    const syncRoute = () => {
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
    setPath(normalizedPath(href));
    window.scrollTo(0, 0);
  }

  function moveSelection(event: KeyboardEvent<HTMLElement>) {
    const links = menu.current?.querySelectorAll<HTMLAnchorElement>('.menu-item');
    if (!links) return;
    const current = Array.from(links).indexOf(document.activeElement as HTMLAnchorElement);
    let next: number;
    if (event.key === 'ArrowDown') next = (current + 1) % links.length;
    else if (event.key === 'ArrowUp') next = (current - 1 + links.length) % links.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = links.length - 1;
    else return;
    event.preventDefault();
    links[next].focus();
    setSelected(next);
  }

  return (
    <div className={`title-screen${isContentPage ? ' about-screen' : ''}${isExperience ? ' experience-screen' : ''}${isBlog || isMissing ? ' blog-screen' : ''}`}>
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
              <section className="about-currently" aria-labelledby="about-currently-title">
                <div className="about-currently-heading">
                  <h2 id="about-currently-title">Currently</h2>
                  <span>Updated <time dateTime="2026-10">October 2026</time></span>
                </div>
                <dl className="about-currently-list">
                  <div>
                    <dt>Working on</dt>
                    <dd>Personal projects</dd>
                  </div>
                  <div>
                    <dt>Watching</dt>
                    <dd>Vinland Saga</dd>
                  </div>
                </dl>
              </section>
              <div className="about-dialogue-actions">
                <a className="about-resume" href={site.resumeHref} target="_blank" rel="noreferrer">Read my résumé</a>
                <a className="about-hello" href={`mailto:${site.email}`}>Say hello</a>
              </div>
            </div>
          </article>
        </main>
      ) : isExperience ? <ExperiencePage headingRef={pageHeading} onReturn={event => navigate(event, '/')} /> : isBlog ? <BlogPage posts={posts} slug={path === '/blog' ? undefined : path.slice('/blog/'.length)} headingRef={pageHeading} onNavigate={navigate} /> : isMissing ? <NotFoundPage headingRef={pageHeading} onReturn={event => navigate(event, '/')} /> : <main className="main-menu page-enter" key="home">
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
            <a key={item.id} href={`/${item.id}`} className={`menu-item ${selected === index ? 'selected' : ''}`} onMouseEnter={() => setSelected(index)} onFocus={() => setSelected(index)} onClick={event => navigate(event, `/${item.id}`)}>
              <span className="menu-pointer" aria-hidden="true">»</span><span>{item.label}</span>
            </a>
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
    </div>
  );
}
