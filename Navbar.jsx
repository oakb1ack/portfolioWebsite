import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { id: 'about',      label: 'About'      },
  { id: 'education',  label: 'Education'  },
  { id: 'experience', label: 'Experience' },
  { id: 'skills',     label: 'Skills'     },
  { id: 'projects',   label: 'Projects'   },
];

export default function Navbar({ sectionRefs, themeMode, onToggleThemeMode }) {
  const [activeSection, setActiveSection] = useState('header');
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);

      const entries = Object.entries(sectionRefs);
      for (const [id, el] of entries) {
        if (el) {
          const { top, bottom } = el.getBoundingClientRect();
          if (top < window.innerHeight * 0.45 && bottom > 0) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [sectionRefs]);

  const goTo = (id) => {
    const el = sectionRefs[id];
    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth',
      });
    }
    setMobileOpen(false);
  };

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`} role="banner">
      <div className="navbar__inner">

        {/* Logo */}
        <button
          onClick={() => goTo('header')}
          className="navbar__logo"
          aria-label="Back to top"
        >
          <span className="navbar__logo-name">Ali</span>
          <span className="navbar__logo-dot" aria-hidden="true">.</span>
        </button>

        {/* Desktop nav links */}
        <nav className="navbar__links" aria-label="Site sections">
          {NAV_LINKS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => goTo(id)}
              className={`nav-link${activeSection === id ? ' nav-link--active' : ''}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="navbar__actions">
          <button
            onClick={onToggleThemeMode}
            className="icon-btn"
            aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {themeMode === 'dark'
              ? <Sun  size={16} strokeWidth={2} />
              : <Moon size={16} strokeWidth={2} />}
          </button>

          <button onClick={() => goTo('contact')} className="btn-outline-sm">
            Contact
          </button>

          {/* Hamburger — mobile only */}
          <button
            className="navbar__hamburger"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav className="navbar__mobile-menu" aria-label="Mobile navigation">
          {NAV_LINKS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => goTo(id)}
              className={`mobile-nav-link${activeSection === id ? ' nav-link--active' : ''}`}
            >
              {label}
            </button>
          ))}
          <button onClick={() => goTo('contact')} className="btn-primary mobile-cta">
            Contact
          </button>
        </nav>
      )}
    </header>
  );
}
