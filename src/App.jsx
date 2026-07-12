import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import Footer from './components/Footer.jsx';
import LoadingOverlay from './components/LoadingOverlay.jsx';
import Navbar from './components/Navbar.jsx';
import { portfolioData } from './data/portfolioData.js';
import About from './sections/About.jsx';
import Contact from './sections/Contact.jsx';
import Education from './sections/Education.jsx';
import Experience from './sections/Experience.jsx';
import Hero from './sections/Hero.jsx';
import Projects from './sections/Projects.jsx';
import Skills from './sections/Skills.jsx';

const THEME_KEY = 'portfolio_theme';
const VALID_THEMES = new Set(['dark', 'light']);

export default function App() {
  const [themeMode, setThemeMode] = useState(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme && VALID_THEMES.has(storedTheme)) return storedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const sectionRefs = useRef({});
  const setRef = (id) => (element) => { sectionRefs.current[id] = element; };

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => setIsLoading(false), 750);
    }, 1800);
    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 400);
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progressBar = document.getElementById('scroll-progress');
      if (progressBar && scrollableHeight > 0) progressBar.style.transform = `scaleX(${window.scrollY / scrollableHeight})`;
      Object.entries(sectionRefs.current).forEach(([id, element]) => {
        if (element && element.getBoundingClientRect().top < window.innerHeight * 0.82) {
          setVisibleSections((sections) => new Set(sections).add(id));
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  const isVisible = (id) => visibleSections.has(id);
  const toggleTheme = () => setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'));

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ color: 'var(--text-primary)' }}>
      {isLoading && <LoadingOverlay isFadingOut={isFadingOut} />}
      <div className="dot-grid-bg" aria-hidden="true" />
      <Navbar sectionRefs={sectionRefs.current} themeMode={themeMode} onToggleThemeMode={toggleTheme} />
      <div id="scroll-progress" className="scroll-progress" aria-hidden="true" />
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`back-to-top ${showBackToTop ? 'visible' : ''}`} aria-label="Back to top"><ArrowUp className="w-5 h-5" /></button>
      <main className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <Hero setRef={setRef} data={portfolioData} />
        <About setRef={setRef} isVisible={isVisible} data={portfolioData} />
        <Education setRef={setRef} isVisible={isVisible} education={portfolioData.education} />
        <Experience setRef={setRef} isVisible={isVisible} experience={portfolioData.experience} />
        <Skills setRef={setRef} isVisible={isVisible} skills={portfolioData.skills} />
        <Projects setRef={setRef} isVisible={isVisible} projects={portfolioData.projects} />
        <Contact setRef={setRef} isVisible={isVisible} contact={portfolioData.contact} />
        <Footer />
      </main>
    </div>
  );
}
