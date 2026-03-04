import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, Mail, Github, Linkedin, Cpu,
  ArrowUp, ArrowRight, FileCode2, BarChart3, Braces,
  CircuitBoard, Layers, Ruler, GitBranch, Bot, FileText,
  ExternalLink, Terminal, Zap, Grid, Code2, Wrench,
} from 'lucide-react';
import Navbar from './Navbar.jsx';
import headshot from './assets/headshot.png';

/* ============================================================
   DATA
   ============================================================ */
const portfolioData = {
  header: {
    name: 'Ali Alfridawi',
    title: 'Computer Science & Electrical Engineering',
  },
  about: {
    content:
      "I'm a Computer Science and Electrical Engineering student at UTA driven by curiosity at the intersection of both fields. Currently conducting undergraduate research in nanophotonics, developing Python-based simulation frameworks to model optical phenomena and analyze experimental data. I'm exploring how machine learning can be applied to my research—from pattern recognition in optical datasets to predictive modeling of photonic structures. My work bridges theory and practice, translating complex mathematical models into efficient computational tools. I'm passionate about building robust engineering tooling, contributing to meaningful research, and crafting elegant solutions that combine hardware knowledge with software expertise.",
  },
  education: [
    {
      degree: 'Bachelor of Science in Computer Science & Electrical Engineering',
      school: 'University of Texas at Arlington',
      year: '2029',
      gpa: '4.0',
      focus: 'Optics and Electronics',
      extracurriculars: [
        'Society of Asian Scientists and Engineers',
        'Association for Computing Machinery',
        'Institute of Electrical and Electronics Engineers',
        'Freshman Leaders on Campus',
      ],
      coursework: [
        'Circuits Analysis One',
        'Electrical Engineering Practicum',
        'Introduction to Electrical Engineering',
        'Intermediate Programming in C',
      ],
      honors: ['Freshman Distinction Roll', 'Maverick Academic Scholarship'],
    },
  ],
  experience: [
    {
      role: 'Undergraduate Research Assistant',
      company: 'University of Texas at Arlington',
      date: '2025 – Present',
      description:
        'Developed Python scripts with NumPy, SciPy, Pandas, and S4 to model and analyze nanophotonics experiments, enabling faster data processing and uncovering key optical patterns that guided subsequent experimental designs.',
      technologies: ['Python', 'NumPy', 'SciPy', 'Pandas', 'S4'],
    },
    {
      role: 'IT Intern',
      company: 'iFortriss',
      date: '2024 – 2025',
      description:
        'Engineered and tested a secure office network infrastructure with a patch panel, a firewall, a ticketing system, wireless access points, and a server, resulting in more reliable network performance and faster issue resolution.',
      technologies: ['Network Engineering', 'Firewall Config', 'Server Admin', 'Ticketing Systems'],
    },
  ],
  skills: {
    Software: {
      description: 'Core programming languages',
      accentVar: '--accent-violet',
      accentRgbVar: '--accent-violet-rgb',
      icon: 'Code2',
      items: [
        { name: 'Python', icon: 'FileCode2' },
        { name: 'C/C++',  icon: 'Braces'    },
      ],
    },
    Tools: {
      description: 'Development & analysis',
      accentVar: '--accent-cyan',
      accentRgbVar: '--accent-cyan-rgb',
      icon: 'Wrench',
      items: [
        { name: 'MATLAB', icon: 'BarChart3'  },
        { name: 'Git',    icon: 'GitBranch'  },
      ],
    },
    Hardware: {
      description: 'EDA & circuit simulation',
      accentVar: '--accent-amber',
      accentRgbVar: '--accent-amber-rgb',
      icon: 'CircuitBoard',
      items: [
        { name: 'Altium',   icon: 'Layers'       },
        { name: 'Multisim', icon: 'CircuitBoard'  },
        { name: 'KiCad',    icon: 'Ruler'         },
      ],
    },
  },
  projects: [
    {
      name: 'LoudPenguin',
      label: 'Discord Bot',
      shortDescription:
        'A production-ready Discord bot delivering real-time financial market data, automated reports, and price alerts to servers.',
      technologies: ['TypeScript', 'Node.js', 'Discord.js', 'MongoDB', 'Finnhub API', 'CoinGecko API'],
      githubUrl: 'https://github.com/AliAlfridawi/loudPenguin',
      status: 'Production',
      icon: 'bot',
      features: [
        'Real-time stock & cryptocurrency quotes with chart data',
        'Configurable price alerts with automatic DM notifications',
        'Automated daily market summary reports at 4:15 PM ET',
      ],
      mockupGradient: 'linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(34,211,238,0.15) 100%)',
      mockupIconBg:   'rgba(99, 102, 241, 0.35)',
    },
    {
      name: 'Citation Manager',
      label: 'Browser Extension',
      shortDescription:
        'A Microsoft Edge extension for IEEE-format citation management across research projects, with auto-cite from URL/DOI.',
      technologies: ['JavaScript', 'HTML5', 'CSS3', 'Manifest V3', 'CrossRef API'],
      githubUrl: 'https://github.com/AliAlfridawi/citationExtension',
      status: 'Production',
      icon: 'fileText',
      features: [
        'IEEE-formatted citations for journals, conferences, websites, and books',
        'Auto-cite from URL or DOI via CrossRef API',
        'BibTeX import/export with drag-and-drop reordering',
      ],
      mockupGradient: 'linear-gradient(135deg, rgba(167,139,250,0.22) 0%, rgba(251,191,36,0.14) 100%)',
      mockupIconBg:   'rgba(167, 139, 250, 0.35)',
    },
  ],
  contact: {
    email: 'ama3373@mavas.uta.edu',
    github: 'https://github.com/AliAlfridawi',
    linkedin: 'https://www.linkedin.com/in/alialfridawi/',
  },
};

/* ============================================================
   ICON REGISTRY
   ============================================================ */
const ICONS = {
  FileCode2, BarChart3, Braces, CircuitBoard, Layers, Ruler,
  GitBranch, Bot, FileText, Code2, Wrench,
};

/* ============================================================
   CONSTANTS
   ============================================================ */
const THEME_KEY    = 'portfolio_theme';
const VALID_THEMES = new Set(['dark', 'light']);

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

/** Animated number counter — fires once on scroll-into-view */
const AnimatedCounter = ({ target, suffix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const ref   = useRef(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !fired.current) {
        fired.current = true;
        const t0 = performance.now();
        const dur = 1400;
        const tick = (now) => {
          const p = Math.min((now - t0) / dur, 1);
          const e = 1 - Math.pow(1 - p, 3);
          setCount(parseFloat((e * target).toFixed(decimals)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, decimals]);

  return (
    <span ref={ref}>
      {decimals > 0 ? count.toFixed(decimals) : Math.round(count)}{suffix}
    </span>
  );
};

/* ── SKILLS BENTO ─────────────────────────────────────────── */
const BentoGroup = ({ groupName, group }) => {
  const GroupIcon = ICONS[group.icon];
  const accent    = `var(${group.accentVar})`;
  const accentBg  = `rgba(var(${group.accentRgbVar}), 0.10)`;

  return (
    <div className={`bento-cell bento-${groupName.toLowerCase()}`}>
      {/* Category header */}
      <div className="bento-category-header">
        <div
          className="bento-category-icon"
          style={{ background: accentBg, color: accent }}
        >
          {GroupIcon && <GroupIcon size={16} />}
        </div>
        <div>
          <div className="bento-category-label" style={{ color: accent }}>
            {groupName}
          </div>
          <div className="bento-category-desc">{group.description}</div>
        </div>
      </div>

      {/* Skill items */}
      <div className="bento-skill-list">
        {group.items.map(({ name, icon }) => {
          const SkillIcon = ICONS[icon];
          return (
            <div key={name} className="bento-skill-item">
              {SkillIcon && <SkillIcon size={14} style={{ color: accent }} />}
              <span>{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── PROJECT FEATURE CARD ─────────────────────────────────── */
const ProjectFeatureCard = ({ project }) => {
  const ProjectIcon = project.icon ? ICONS[project.icon === 'bot' ? 'Bot' : 'FileText'] : null;

  return (
    <div className="project-feature-card">
      {/* Left: visual mockup area */}
      <div
        className="project-mockup"
        style={{ background: project.mockupGradient }}
      >
        <div
          className="project-mockup-icon"
          style={{ background: project.mockupIconBg }}
        >
          {ProjectIcon && <ProjectIcon size={26} color="#fff" />}
        </div>
        <div className="project-mockup-label">{project.label}</div>
      </div>

      {/* Right: content */}
      <div className="project-content">
        {/* Header row */}
        <div className="project-content-header">
          <h3>{project.name}</h3>
          <span className="chip chip-accent" style={{ flexShrink: 0 }}>
            {project.status}
          </span>
        </div>

        {/* Description */}
        <p className="project-description">{project.shortDescription}</p>

        {/* Top 3 features */}
        <div className="project-features-list">
          {project.features.map((f, i) => (
            <div key={i} className="project-feature-item">
              <span className="project-feature-bullet" aria-hidden="true" />
              {f}
            </div>
          ))}
        </div>

        {/* Tech pills */}
        <div className="project-tech-row">
          {project.technologies.map((t, i) => (
            <span key={i} className="project-tech-pill">{t}</span>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="project-footer">
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{ fontSize: '0.85rem', padding: '8px 16px' }}
          >
            <Github size={15} />
            View Source
            <ExternalLink size={12} style={{ opacity: 0.5 }} />
          </a>
        </div>
      </div>
    </div>
  );
};

/* ── EDUCATION CARD (accordion) ───────────────────────────── */
const EducationCard = ({ edu, idx, isExpanded, onToggle }) => {
  const panelId = `edu-panel-${idx}`;
  return (
    <div className={`card-schematic overflow-hidden education-card ${isExpanded ? 'is-open' : ''}`}>
      <button
        onClick={onToggle}
        className="education-toggle w-full px-6 py-5 text-left"
        aria-expanded={isExpanded}
        aria-controls={panelId}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`education-led ${isExpanded ? 'active' : ''}`} aria-hidden="true" />
              <h3 className="font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {edu.degree}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-violet)', fontWeight: 500 }}>{edu.school}</span>
              <span>·</span>
              <span>Class of {edu.year}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Cpu size={28} style={{ opacity: 0.12 }} />
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              style={{ color: 'var(--accent-violet)' }}
            />
          </div>
        </div>
      </button>

      <div id={panelId} className={`education-expand-grid ${isExpanded ? 'open' : ''}`}>
        <div
          className="education-expand-inner px-6 py-5"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <div className="grid gap-2 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
            {[
              ['GPA',              edu.gpa],
              ['Focus',            edu.focus],
              ['Extracurriculars', edu.extracurriculars?.join(', ')],
            ].map(([label, val]) => (
              <div key={label} className="education-meta-row">
                <span className="education-meta-label">{label}</span>
                <span className="education-meta-value">{val}</span>
              </div>
            ))}
          </div>

          {[['Coursework', edu.coursework], ['Honors', edu.honors]].map(([label, items]) => (
            <div key={label} className="education-tag-block mt-4">
              <div className="education-meta-label">{label}</div>
              <div className="education-tag-wrap">
                {(items ?? []).map((v, i) => <span key={i} className="education-tag">{v}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function Portfolio() {
  /* --- Theme --- */
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored && VALID_THEMES.has(stored)) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  /* --- UI state --- */
  const [isLoading,       setIsLoading]      = useState(true);
  const [isFadingOut,     setIsFadingOut]     = useState(false);
  const [showBackToTop,   setShowBackToTop]   = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [expandedEdu,     setExpandedEdu]     = useState(null);

  const sectionRefs = useRef({});
  const ref = (id) => (el) => { sectionRefs.current[id] = el; };

  /* --- Loading timer --- */
  useEffect(() => {
    const t = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => setIsLoading(false), 750);
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  /* --- Scroll tracking --- */
  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 400);
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const bar = document.getElementById('scroll-progress');
      if (bar && scrollable > 0) {
        bar.style.transform = `scaleX(${window.scrollY / scrollable})`;
      }
      Object.entries(sectionRefs.current).forEach(([id, el]) => {
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.82) {
          setVisibleSections(prev => new Set(prev).add(id));
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* --- Theme sync --- */
  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  const toggleTheme = () => setThemeMode(m => m === 'dark' ? 'light' : 'dark');
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ color: 'var(--text-primary)' }}>

      {/* Loading overlay */}
      {isLoading && (
        <div className={`loading-overlay ${isFadingOut ? 'fade-out' : ''}`}>
          <div className="loading-ambient" />
          <div className="loading-rings">
            <div className="loading-ring" /><div className="loading-ring" /><div className="loading-ring" />
          </div>
          <div className="loading-text">Loading</div>
          <div className="loading-progress-container">
            <div className="loading-progress-bar" />
          </div>
        </div>
      )}

      {/* Background */}
      <div className="dot-grid-bg" aria-hidden="true" />

      {/* Navigation */}
      <Navbar
        sectionRefs={sectionRefs.current}
        themeMode={themeMode}
        onToggleThemeMode={toggleTheme}
      />

      {/* Scroll progress */}
      <div id="scroll-progress" className="scroll-progress" aria-hidden="true" />

      {/* Back to top */}
      <button
        onClick={scrollToTop}
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pb-32">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <header ref={ref('header')} className="hero-section">
          <div className="hero-layout">
            <div className="hero-text">
              <div className="hero-badge">
                <span className="hero-badge-dot" aria-hidden="true" />
                Available for internships · Summer 2026
              </div>

              <h1 className="hero-name">
                Ali <span className="text-gradient">Alfridawi</span>
              </h1>

              <p className="hero-tagline">{portfolioData.header.title}</p>

              <p className="hero-bio">
                Building at the intersection of hardware and software.{' '}
                Undergraduate researcher in{' '}
                <span className="bio-highlight">nanophotonics</span>
                , developing Python simulation frameworks and exploring ML
                applications in optical systems.
              </p>

              <div className="hero-chips">
                <span className="chip">UTA · Class of 2029</span>
                <span className="chip chip-accent">4.0 GPA</span>
                <span className="chip">Research Assistant</span>
              </div>

              <div className="hero-actions">
                <a href={`mailto:${portfolioData.contact.email}`} className="btn-primary">
                  Get in touch <ArrowRight size={15} />
                </a>
                <a href={portfolioData.contact.github} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  <Github size={16} /> GitHub
                </a>
                <a href={portfolioData.contact.linkedin} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  <Linkedin size={16} /> LinkedIn
                </a>
              </div>
            </div>

            <div className="hero-photo-shell">
              <div className="hero-photo-frame">
                <img
                  src={headshot}
                  alt="Portrait of Ali Alfridawi"
                  className="hero-photo-img"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
          <div className="hero-scroll-cue" aria-hidden="true">
            <ChevronDown size={20} />
          </div>
        </header>

        {/* ── ABOUT ─────────────────────────────────────────────── */}
        <section
          ref={ref('about')}
          className={`section-reveal ${visibleSections.has('about') ? 'visible' : ''} mb-28`}
        >
          <div className="section-heading">
            <div className="section-heading-icon"><Terminal size={18} /></div>
            <h2>About</h2>
            <span className="status-dot" />
          </div>
          <div className="card-schematic p-8 md:p-10">
            <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: '72ch' }}>
              {portfolioData.about.content}
            </p>
          </div>
        </section>

        {/* ── INFO GRID ─────────────────────────────────────────── */}
        <section
          ref={ref('bio')}
          className={`section-reveal ${visibleSections.has('bio') ? 'visible' : ''} mb-28`}
        >
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Hobbies',  value: 'Card Games & Working Out' },
              { label: 'Focus',    value: 'Photonics & Electronics'   },
              { label: 'Interest', value: 'Competitive Programming'   },
            ].map(({ label, value }) => (
              <div key={label} className="card-schematic p-6">
                <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                   style={{ color: 'var(--text-muted)' }}>
                  {label}
                </p>
                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── EDUCATION ─────────────────────────────────────────── */}
        <section
          ref={ref('education')}
          className={`section-reveal ${visibleSections.has('education') ? 'visible' : ''} mb-28`}
        >
          <div className="section-heading">
            <div className="section-heading-icon">
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>E</span>
            </div>
            <h2>Education</h2>
            <span className="status-dot" />
          </div>
          <div className="space-y-4">
            {portfolioData.education.map((edu, i) => (
              <EducationCard
                key={`${edu.school}-${i}`}
                edu={edu}
                idx={i}
                isExpanded={expandedEdu === i}
                onToggle={() => setExpandedEdu(expandedEdu === i ? null : i)}
              />
            ))}
          </div>
        </section>

        {/* ── EXPERIENCE ────────────────────────────────────────── */}
        <section
          ref={ref('experience')}
          className={`section-reveal ${visibleSections.has('experience') ? 'visible' : ''} mb-28`}
        >
          <div className="section-heading">
            <div className="section-heading-icon"><Zap size={18} /></div>
            <h2>Experience</h2>
            <span className="status-dot" />
          </div>

          <div className="experience-timeline">
            {portfolioData.experience.map((exp, i) => (
              <div key={i} className="experience-item">
                <span className="experience-dot" aria-hidden="true" />
                <div className="experience-card">
                  <div className="experience-card-top">
                    <span className="experience-role">{exp.role}</span>
                    <span className="chip font-mono text-xs flex-shrink-0">{exp.date}</span>
                  </div>
                  <p className="experience-company">{exp.company}</p>
                  <p className="experience-description">{exp.description}</p>
                  <div className="experience-tech-row">
                    {exp.technologies.map((t, j) => (
                      <span key={j} className="project-tech-pill">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SKILLS ────────────────────────────────────────────── */}
        <section
          ref={ref('skills')}
          className={`section-reveal ${visibleSections.has('skills') ? 'visible' : ''} mb-28`}
        >
          <div className="section-heading">
            <div className="section-heading-icon"><Grid size={18} /></div>
            <h2>Skills</h2>
            <span className="status-dot" />
          </div>

          <div className="bento-grid">
            {Object.entries(portfolioData.skills).map(([name, group]) => (
              <BentoGroup key={name} groupName={name} group={group} />
            ))}
          </div>

          {/* Stats bar */}
          <div
            className="mt-4 px-6 py-4 card-schematic flex flex-wrap justify-between gap-4 text-xs font-mono"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>GPA <span style={{ color: 'var(--accent-violet)' }}>
              <AnimatedCounter target={4.0} suffix="" decimals={1} />
            </span></span>
            <span>Projects <span style={{ color: 'var(--accent-cyan)' }}>
              <AnimatedCounter target={2} suffix="+" />
            </span></span>
            <span>Uptime <span style={{ color: 'var(--accent-amber)' }}>
              <AnimatedCounter target={99.9} suffix="%" decimals={1} />
            </span></span>
          </div>
        </section>

        {/* ── PROJECTS ──────────────────────────────────────────── */}
        <section
          ref={ref('projects')}
          className={`section-reveal ${visibleSections.has('projects') ? 'visible' : ''} mb-28`}
        >
          <div className="section-heading">
            <div className="section-heading-icon"><Code2 size={18} /></div>
            <h2>Projects</h2>
            <span className="status-dot" />
          </div>

          <div>
            {portfolioData.projects.map((p, i) => (
              <ProjectFeatureCard key={i} project={p} />
            ))}
          </div>
        </section>

        {/* ── CONTACT ───────────────────────────────────────────── */}
        <section
          ref={ref('contact')}
          className={`section-reveal ${visibleSections.has('contact') ? 'visible' : ''} mb-16`}
        >
          <div
            className="card-schematic p-10 md:p-14 text-center"
            style={{
              background: `radial-gradient(ellipse 70% 60% at 50% 0%, rgba(var(--accent-violet-rgb), 0.06) 0%, transparent 70%), var(--bg-card)`,
            }}
          >
            <h2 className="mb-3" style={{ color: 'var(--text-primary)' }}>
              Let&rsquo;s connect
            </h2>
            <p className="mb-8 max-w-sm mx-auto text-base" style={{ color: 'var(--text-secondary)' }}>
              Open to research collaborations, internships, and interesting engineering conversations.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a href={`mailto:${portfolioData.contact.email}`} className="btn-primary justify-center">
                <Mail size={16} /> Send an email
              </a>
              <a href={portfolioData.contact.github} target="_blank" rel="noopener noreferrer" className="btn-ghost justify-center">
                <Github size={16} /> GitHub
              </a>
              <a href={portfolioData.contact.linkedin} target="_blank" rel="noopener noreferrer" className="btn-ghost justify-center">
                <Linkedin size={16} /> LinkedIn
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs font-mono pb-8" style={{ color: 'var(--text-muted)' }}>
          <div className="mb-1">© 2026 Ali Alfridawi</div>
          <div>Built with React · Tailwind · Vite</div>
        </footer>

      </main>
    </div>
  );
}
