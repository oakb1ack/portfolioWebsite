import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Mail, Github, Linkedin, Cpu, Terminal, Zap, ExternalLink, Grid, ArrowUp, FileCode2, BarChart3, Braces, CircuitBoard, Layers, Ruler, GitBranch, Bot, FileText } from 'lucide-react';
import Taskbar from './Taskbar.jsx';
import headshot from './assets/headshot.png';

// Portfolio Data
const portfolioData = {
  header: {
    name: 'Ali Alfridawi',
    title: 'Computer Science and Electrical Engineering Major',
    bio: 'Engineer passionate about the intersection of computer science and electrical engineering, with a focus on photonics research and building the tools that power discovery.',
  },
  about: {
    content:
      "I'm a Computer Science and Electrical Engineering student at UTA driven by curiosity at the intersection of both fields. Currently conducting undergraduate research in nanophotonics, developing Python-based simulation frameworks to model optical phenomena and analyze experimental data. I'm exploring how machine learning can be applied to my researchâ€”from pattern recognition in optical datasets to predictive modeling of photonic structures. My work bridges theory and practice, translating complex mathematical models into efficient computational tools. I'm passionate about building robust engineering tooling, contributing to meaningful research, and crafting elegant solutions that combine hardware knowledge with software expertise. Always eager to collaborate and learnâ€”feel free to reach out.",
  },
  education: [
    {
      degree: 'Bachelor of Science in Computer Science & Electrical Engineering',
      school: 'University of Texas at Arlington',
      year: '2029',
      gpa: '4.0',
      focus: 'Optics and Electronics',
      extracurriculars: ['Society of Asian Scientists and Engineers', 'Association for Computing Machinery', 'Institute of Electrical and Electronics Engineers', 'Freshman Leaders on Campus'],
      coursework: ['Circuits Analysis One', 'Electrical Engineering Practicum', 'Introduction to Electrical Engineering', 'Intermediate Programming in C'],
      honors: ["Freshman Distinction Roll", 'Maverick Academic Scholarship'],
    },
  ],
  experience: [
    {
      role: 'Undergraduate Research Assistant',
      company: 'University of Texas at Arlington',
      date: '2025 - Present',
      description:
        'Developed Python scripts with NumPy, SciPy, Pandas, and S4 to model and analyze nanophotonics experiments, enabling faster data processing and uncovering key optical patterns that guided subsequent experimental designs.',
    },
    {
      role: 'IT Intern',
      company: 'iFortriss',
      date: '2024 - 2025',
      description:
        'Engineered and tested a secure office network infrastructure with a patch panel, a firewall, a ticketing system, wireless access points, and a server, resulting in more reliable network performance and faster issue resolution.',
    },
  ],
  skills: [
    'Python',
    'MATLAB',
    'C/C++',
    'Multisim',
    'Altium',
    'KiCad',
    'Git',
  ],
  projects: [
    {
      name: 'LoudPenguin',
      shortDescription: 'Feature-rich Discord bot for stocks, crypto, forex, and price alerts',
      longDescription: 'A comprehensive financial tracking Discord bot that helps servers stay on top of markets with real-time data, automated reports, and penguin-themed personality. Features stock quotes, cryptocurrency tracking, forex conversion, price alerts with DM notifications, personal and server watchlists, and automated daily market summaries. Built with TypeScript and production-hardened for reliability.',
      technologies: ['TypeScript', 'Node.js', 'Discord.js', 'MongoDB', 'Mongoose', 'Finnhub API', 'CoinGecko API'],
      githubUrl: 'https://github.com/AliAlfridawi/loudPenguin',
      features: [
        'Real-time stock quotes, charts, and company metrics',
        'Cryptocurrency prices and top coins by market cap',
        'Forex currency conversion and exchange rates',
        'Price alerts with automatic DM notifications',
        'Personal and server watchlists (up to 25/50 stocks)',
        'Automated daily market reports at 4:15 PM ET',
        'Financial news aggregation and stock-specific headlines'
      ],
      status: 'Production Ready',
      icon: 'bot'
    },
    {
      name: 'Citation Manager',
      shortDescription: 'Edge extension for managing research citations in IEEE format',
      longDescription: 'A Microsoft Edge extension for managing research citations in IEEE format across multiple projects. Built with vanilla JavaScript and Manifest V3 for simplicity, performance, and privacy. All citation data is stored locally with zero external dependencies, ensuring complete user privacy while providing powerful citation management capabilities.',
      technologies: ['JavaScript', 'HTML5', 'CSS3', 'Manifest V3', 'CrossRef API'],
      githubUrl: 'https://github.com/AliAlfridawi/citationExtension',
      features: [
        'IEEE-formatted citations for journals, conferences, websites, and books',
        'Multi-project workspace citation management',
        'Auto-cite from URL or DOI via CrossRef API',
        'BibTeX import and export support',
        'Drag-and-drop citation reordering with auto-renumbering',
        'Dark and light theme with OS preference detection'
      ],
      status: 'Production Ready',
      icon: 'fileText'
    }
  ],
  contact: {
    email: 'ama3373@mavas.uta.edu',
    github: 'https://github.com/AliAlfridawi',
    linkedin: 'https://www.linkedin.com/in/alialfridawi/',
  },
};

// Skill to icon mapping
const skillIconMap = {
  Python: FileCode2,
  MATLAB: BarChart3,
  'C/C++': Braces,
  Multisim: CircuitBoard,
  Altium: Layers,
  KiCad: Ruler,
  Git: GitBranch,
};

// Project to icon mapping
const projectIconMap = {
  bot: Bot,
  fileText: FileText,
};

const THEME_STORAGE_KEY = 'portfolio_theme_mode';
const VALID_THEME_MODES = new Set(['cs-dark', 'ee-light']);

// Floating Binary Particles Component
const BinaryParticles = () => {
  const particles = useMemo(() => {
    const chars = ['0', '1', '0x3F', '0xA7', '0x1B', '01', '10', '0xFF', '0b1010', '11'];
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      text: chars[Math.floor(Math.random() * chars.length)],
      left: `${Math.random() * 100}%`,
      fontSize: `${10 + Math.random() * 4}px`,
      duration: `${18 + Math.random() * 16}s`,
      delay: `${-Math.random() * 20}s`,
      maxOpacity: 0.06 + Math.random() * 0.08,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {particles.map(p => (
        <span
          key={p.id}
          className="binary-particle"
          style={{
            left: p.left,
            fontSize: p.fontSize,
            '--duration': p.duration,
            '--delay': p.delay,
            '--max-opacity': p.maxOpacity,
          }}
        >
          {p.text}
        </span>
      ))}
    </div>
  );
};

// Scanline bar element for card hover effect
const ScanlineBar = () => <span className="scanline-bar" aria-hidden="true" />;

// Animated Counter Component
const AnimatedCounter = ({ target, suffix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const duration = 1500;
          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(parseFloat((eased * target).toFixed(decimals)));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, decimals]);

  return (
    <span ref={ref}>
      {decimals > 0 ? count.toFixed(decimals) : Math.round(count)}{suffix}
    </span>
  );
};

// Typing Effect Component
const TypingEffect = ({ text, speed = 30, className = "" }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    let index = 0;
    setDisplayedText(""); 
    const interval = setInterval(() => {
      if (index < text.length) {
        const nextChar = text[index];
        setDisplayedText((prev) => {
          const result = prev + nextChar;
          return result;
        });
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className} style={{ display: 'inline-block', minWidth: '100%', whiteSpace: 'normal' }}>
      {displayedText}
      <span className="typing-cursor"></span>
    </span>
  );
};

// New Project Card Component
const ProjectCard = ({ project, isExpanded, onToggle }) => {
  const ProjectIcon = project.icon ? projectIconMap[project.icon] : null;
  return (
    <div className="card-schematic card-scanline overflow-hidden mb-6 project-card">
      <ScanlineBar />
      {/* Card Header */}
      <button
        onClick={onToggle}
        className="w-full px-8 py-6 flex items-center justify-between transition-colors focus-visible:outline-2 focus-visible:outline-amber-400"
        aria-expanded={isExpanded}
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3 mb-2">
            {ProjectIcon && <ProjectIcon className="w-6 h-6 text-amber-400 flex-shrink-0" />}
            <h3 className="text-xl md:text-2xl font-mono text-amber-400 hover-scanline relative overflow-hidden">{project.name}</h3>
            <span className="px-2 py-1 text-xs border border-amber-400/30 text-amber-300 bg-amber-400/10 font-mono">
              STATUS::{project.status.toUpperCase()}
            </span>
          </div>
          <p className="text-slate-400 font-mono text-sm mb-3">
            &gt; {project.shortDescription}
          </p>
          <div className="flex flex-wrap gap-2">
            {project.technologies.slice(0, 3).map((tech, idx) => (
              <span key={idx} className="text-xs text-slate-500 font-mono">
                [{tech}]
              </span>
            ))}
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-amber-400 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expandable Content */}
      <div className={`project-expand-grid ${isExpanded ? 'open' : ''}`}>
        <div className="project-expand-inner border-t border-slate-700 px-8 py-8 bg-slate-900/50">
          <div className="font-mono text-slate-300 mb-6 text-sm leading-relaxed border-l-2 border-amber-400/50 pl-4">
            {project.longDescription}
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="text-sm font-mono text-amber-300 mb-3 uppercase tracking-wider">System Features</h4>
              <ul className="space-y-2">
                {project.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-400 font-mono">
                    <span className="text-amber-400 mt-1">â–¹</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-mono text-amber-300 mb-3 uppercase tracking-wider">Tech Stack</h4>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, idx) => (
                  <span
                    key={idx}
                    className="skill-badge px-3 py-1 text-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2 border border-amber-400 text-amber-300 hover:bg-amber-400/10 hover:text-amber-200 transition-all font-mono text-sm group"
          >
            <Github className="w-4 h-4" />
            <span>SOURCE_CODE</span>
            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
          </a>
        </div>
      </div>
    </div>
  );
};

const EducationCard = ({ edu, idx, isExpanded, onToggle }) => {
  const panelId = `education-panel-${idx}`;
  return (
    <div className={`card-schematic card-scanline relative overflow-hidden education-card ${isExpanded ? 'is-open' : ''}`}>
      <ScanlineBar />
      <button
        onClick={onToggle}
        className="education-toggle w-full px-8 py-6 text-left transition-all"
        aria-expanded={isExpanded}
        aria-controls={panelId}
      >
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`education-led ${isExpanded ? 'active' : ''}`} aria-hidden="true" />
              <h3 className="text-2xl text-slate-100 font-bold leading-tight">{edu.degree}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-slate-400">
              <span className="text-amber-400">{edu.school}</span>
              <span>|</span>
              <span>Class of {edu.year}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="opacity-20">
              <Cpu size={38} />
            </div>
            <ChevronDown className={`w-5 h-5 text-amber-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      <div id={panelId} className={`education-expand-grid ${isExpanded ? 'open' : ''}`}>
        <div className="education-expand-inner border-t border-slate-700 px-8 py-6 bg-slate-900/50">
          <div className="grid gap-2 text-xs md:text-sm font-mono text-slate-300">
            <div className="education-meta-row">
              <span className="education-meta-label">GPA</span>
              <span className="education-meta-value">{edu.gpa}</span>
            </div>
            <div className="education-meta-row">
              <span className="education-meta-label">Focus</span>
              <span className="education-meta-value">{edu.focus}</span>
            </div>
            <div className="education-meta-row">
              <span className="education-meta-label">Extracurriculars</span>
              <span className="education-meta-value">{edu.extracurriculars?.join(', ')}</span>
            </div>
          </div>

          <div className="education-tag-block mt-5">
            <div className="education-meta-label">Coursework</div>
            <div className="education-tag-wrap mt-2">
              {(edu.coursework?.length ? edu.coursework : ['None listed']).map((item, i) => (
                <span key={i} className="education-tag">{item}</span>
              ))}
            </div>
          </div>

          <div className="education-tag-block mt-4">
            <div className="education-meta-label">Honors</div>
            <div className="education-tag-wrap mt-2">
              {(edu.honors?.length ? edu.honors : ['None listed']).map((item, i) => (
                <span key={i} className="education-tag">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Briefcase Icon substitute for Lucide import
const BriefcaseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 w-8 h-8">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export default function Portfolio() {
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'cs-dark';

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme && VALID_THEME_MODES.has(storedTheme)) return storedTheme;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'cs-dark' : 'ee-light';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [expandedEducation, setExpandedEducation] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  const sectionRefs = useRef({});

  // Loading Timer with fade-out transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      // Remove overlay from DOM after fade animation completes
      setTimeout(() => setIsLoading(false), 800);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Scroll Tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setShowBackToTop(window.scrollY > 400);

      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      const progressBar = document.getElementById('scroll-progress');
      if (progressBar) progressBar.style.transform = `scaleX(${scrollProgress / 100})`;

      // Section Reveal
      Object.entries(sectionRefs.current).forEach(([id, element]) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.75) {
            setVisibleSections(prev => new Set(prev).add(id));
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode(prev => (prev === 'cs-dark' ? 'ee-light' : 'cs-dark'));
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="relative min-h-screen text-slate-300 overflow-x-hidden font-sans">
      {/* Loading Overlay */}
      {isLoading && (
        <div className={`loading-overlay ${isFadingOut ? 'fade-out' : ''}`}>
          <div className="loading-ambient" />
          <div className="loading-rings">
            <div className="loading-ring" />
            <div className="loading-ring" />
            <div className="loading-ring" />
          </div>
          <div className="loading-text">LOADING</div>
          <div className="loading-progress-container">
            <div className="loading-progress-bar"></div>
          </div>
        </div>
      )}

      {/* Floating Binary Particles */}
      <BinaryParticles />

      {/* PCB Circuit Board Background */}
      <div className="pcb-background" />

      <Taskbar
        sectionRefs={sectionRefs.current}
        themeMode={themeMode}
        onToggleThemeMode={toggleThemeMode}
      />

      <div id="scroll-progress" className="scroll-progress transform scale-x-0 origin-left" />

      <button onClick={scrollToTop} className={`back-to-top ${showBackToTop ? 'visible' : ''}`}>
        <ArrowUp className="w-5 h-5" />
      </button>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32">
        
        {/* HEADER Section */}
        <header ref={el => sectionRefs.current['header'] = el} className="min-h-[80vh] flex flex-col justify-center mb-24 relative">
          <div className="hero-grid section-reveal visible">
            <aside className="headshot-shell order-1 md:order-2">
              <figure className="headshot-card">
                <img
                  src={headshot}
                  alt="Portrait of Ali Alfridawi"
                  className="headshot-image"
                  loading="eager"
                  decoding="async"
                />
              </figure>
            </aside>

            <div className="terminal-window order-2 md:order-1 w-full">
              <div className="terminal-header">
                <div className="terminal-dot dot-red"></div>
                <div className="terminal-dot dot-yellow"></div>
                <div className="terminal-dot dot-amber"></div>
                <span className="ml-4 text-xs text-slate-400">user@portfolio:~</span>
              </div>
              <div className="p-8 md:p-12">
                <h1 className="text-4xl md:text-6xl font-bold text-slate-100 mb-4 hover-scanline relative overflow-hidden">
                  {portfolioData.header.name}
                </h1>
                <h2 className="text-xl md:text-2xl text-amber-400 font-mono mb-8">
                  &lt;{portfolioData.header.title} /&gt;
                </h2>

                <div className="font-mono text-sm md:text-base text-slate-400 leading-relaxed border-l-2 border-slate-700 pl-4 mb-8">
                  <span className="text-amber-300">const</span> bio = <span className="text-amber-300">"</span>
                  <TypingEffect text={portfolioData.header.bio} speed={30} />
                  <span className="text-amber-300">"</span>;
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="px-4 py-2 border border-amber-400/30 bg-amber-400/10 text-amber-300 font-mono text-sm">
                    :: UTA Freshman
                  </div>
                  <div className="px-4 py-2 border border-amber-400/30 bg-amber-400/10 text-amber-300 font-mono text-sm">
                    :: Research Assistant
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ABOUT Section */}
        <section ref={el => sectionRefs.current['about'] = el} className={`section-reveal ${visibleSections.has('about') ? 'visible' : ''} mb-32`}>
          <div className="flex items-center gap-4 mb-8">
             <Terminal className="w-8 h-8 text-amber-400" />
             <h2 className="text-3xl font-bold text-slate-100">SYSTEM_OVERVIEW</h2>
             <span className="status-dot" />
             <span className="text-xs font-mono text-amber-400/50">ONLINE</span>
          </div>
          
          <div className="card-schematic card-scanline p-8 md:p-12">
            <ScanlineBar />
             <p className="text-lg leading-relaxed font-mono text-slate-300">
               {portfolioData.about.content}
             </p>
          </div>
        </section>

        {/* INFO GRID (Hobbies/Focus/Interest) */}
        <section ref={el => sectionRefs.current['bio'] = el} className={`section-reveal ${visibleSections.has('bio') ? 'visible' : ''} mb-32`}>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card-schematic card-scanline p-6 hover:border-amber-400 group">
              <ScanlineBar />
              <div className="text-xs font-mono text-slate-500 mb-2">MODULE: 01</div>
              <h3 className="text-xl text-amber-300 font-mono mb-2 group-hover:text-amber-200">Hobbies</h3>
              <p className="text-sm text-slate-400 font-mono">Card Games & Working Out</p>
            </div>
            <div className="card-schematic card-scanline p-6 hover:border-amber-400 group">
              <ScanlineBar />
              <div className="text-xs font-mono text-slate-500 mb-2">MODULE: 02</div>
              <h3 className="text-xl text-amber-400 font-mono mb-2 group-hover:text-amber-200">Focus</h3>
              <p className="text-sm text-slate-400 font-mono">Photonics & Electronics</p>
            </div>
            <div className="card-schematic card-scanline p-6 hover:border-amber-400 group">
              <ScanlineBar />
              <div className="text-xs font-mono text-slate-500 mb-2">MODULE: 03</div>
              <h3 className="text-xl text-amber-400 font-mono mb-2 group-hover:text-amber-200">Interest</h3>
              <p className="text-sm text-slate-400 font-mono">Competitive Programming</p>
            </div>
          </div>
        </section>

        {/* EDUCATION Section */}
        <section ref={el => sectionRefs.current['education'] = el} className={`section-reveal ${visibleSections.has('education') ? 'visible' : ''} mb-32`}>
          <div className="flex items-center gap-4 mb-8">
             <div className="w-8 h-8 border border-amber-400 flex items-center justify-center">
               <span className="text-amber-400 font-mono font-bold">E</span>
             </div>
            <h2 className="text-3xl font-bold text-slate-100">EDUCATION_LOG</h2>
            <span className="status-dot" />
            <span className="text-xs font-mono text-amber-400/50">ONLINE</span>
          </div>

          <div className="space-y-6">
            {portfolioData.education.map((edu, idx) => (
              <EducationCard
                key={`${edu.school}-${edu.year}-${idx}`}
                edu={edu}
                idx={idx}
                isExpanded={expandedEducation === idx}
                onToggle={() => setExpandedEducation(expandedEducation === idx ? null : idx)}
              />
            ))}
          </div>
        </section>

        {/* EXPERIENCE Section */}
        <section ref={el => sectionRefs.current['experience'] = el} className={`section-reveal ${visibleSections.has('experience') ? 'visible' : ''} mb-32`}>
           <div className="flex items-center gap-4 mb-8">
             <BriefcaseIcon />
             <h2 className="text-3xl font-bold text-slate-100">WORK_HISTORY</h2>
             <span className="status-dot" />
             <span className="text-xs font-mono text-amber-400/50">ONLINE</span>
           </div>

           <div className="border-l-2 border-slate-700 ml-4 space-y-12">
             {portfolioData.experience.map((exp, idx) => (
               <div key={idx} className="relative pl-8">
                 <div className="absolute -left-[9px] top-0 w-4 h-4 bg-slate-900 border-2 border-amber-400 rounded-full"></div>
                 
                 <div className="card-schematic card-scanline p-8">
                   <ScanlineBar />
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                     <h3 className="text-xl font-bold text-slate-100">{exp.role}</h3>
                     <span className="font-mono text-xs px-2 py-1 bg-slate-800 text-amber-300 rounded">
                       {exp.date}
                     </span>
                   </div>
                   <div className="text-amber-300 font-mono text-sm mb-4">{exp.company}</div>
                   <p className="text-slate-400 leading-relaxed font-mono text-sm">
                     {exp.description}
                   </p>
                 </div>
               </div>
             ))}
           </div>
        </section>

        {/* SKILLS Section */}
        <section ref={el => sectionRefs.current['skills'] = el} className={`section-reveal ${visibleSections.has('skills') ? 'visible' : ''} mb-32`}>
          <div className="flex items-center gap-4 mb-8">
            <Zap className="w-8 h-8 text-yellow-500" />
            <h2 className="text-3xl font-bold text-slate-100">TECHNICAL_COMPETENCIES</h2>
            <span className="status-dot" />
            <span className="text-xs font-mono text-amber-400/50">ONLINE</span>
          </div>
          
          <div className="card-schematic card-scanline p-10">
            <ScanlineBar />
            <div className="flex flex-wrap gap-4 justify-center">
              {portfolioData.skills.map((skill, idx) => {
                const SkillIcon = skillIconMap[skill];
                return (
                  <div key={idx} className="skill-badge px-6 py-3 text-sm font-medium tracking-wide flex items-center gap-2">
                    {SkillIcon && <SkillIcon className="w-4 h-4" />}
                    {skill.toUpperCase()}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-700/50 flex justify-between text-xs font-mono text-slate-500">
              <span>MEMORY_USAGE: <AnimatedCounter target={45} suffix="%" /></span>
              <span>CPU_LOAD: <AnimatedCounter target={12} suffix="%" /></span>
              <span>UPTIME: <AnimatedCounter target={99.9} suffix="%" decimals={1} /></span>
            </div>
          </div>
        </section>

        {/* PROJECTS Section */}
        <section ref={el => sectionRefs.current['projects'] = el} className={`section-reveal ${visibleSections.has('projects') ? 'visible' : ''} mb-32`}>
          <div className="flex items-center gap-4 mb-8">
            <Grid className="w-8 h-8 text-amber-400" />
            <h2 className="text-3xl font-bold text-slate-100">PROJECT_MANIFEST</h2>
            <span className="status-dot" />
            <span className="text-xs font-mono text-amber-400/50">ONLINE</span>
          </div>

          <div className="space-y-4">
            {portfolioData.projects.map((project, index) => (
              <ProjectCard
                key={index}
                project={project}
                isExpanded={expandedProject === project.name}
                onToggle={() => setExpandedProject(expandedProject === project.name ? null : project.name)}
              />
            ))}
          </div>
        </section>

        {/* CONTACT Section */}
        <section ref={el => sectionRefs.current['contact'] = el} className={`section-reveal ${visibleSections.has('contact') ? 'visible' : ''} mb-20`}>
          <div className="card-schematic card-scanline p-10 md:p-14 text-center">
            <ScanlineBar />
            <h2 className="text-4xl font-bold text-slate-100 mb-8">INITIATE_COMMUNICATION</h2>
            
            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <a href={`mailto:${portfolioData.contact.email}`} className="group card-schematic card-scanline p-6 flex flex-col items-center gap-3 hover:border-amber-400 min-w-[200px]">
                <ScanlineBar />
                <Mail className="w-8 h-8 text-slate-400 group-hover:text-amber-400 transition-colors" />
                <span className="font-mono text-xs text-slate-500">EMAIL_PROTOCOL</span>
                <span className="text-sm text-slate-300">Send Message</span>
              </a>
              
              <a href={portfolioData.contact.github} target="_blank" className="group card-schematic card-scanline p-6 flex flex-col items-center gap-3 hover:border-amber-400 min-w-[200px]">
                <ScanlineBar />
                <Github className="w-8 h-8 text-slate-400 group-hover:text-amber-400 transition-colors" />
                <span className="font-mono text-xs text-slate-500">GIT_REPO</span>
                <span className="text-sm text-slate-300">View Source</span>
              </a>
              
              <a href={portfolioData.contact.linkedin} target="_blank" className="group card-schematic card-scanline p-6 flex flex-col items-center gap-3 hover:border-amber-400 min-w-[200px]">
                <ScanlineBar />
                <Linkedin className="w-8 h-8 text-slate-400 group-hover:text-amber-400 transition-colors" />
                <span className="font-mono text-xs text-slate-500">LINKEDIN</span>
                <span className="text-sm text-slate-300">Connect</span>
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="text-center font-mono text-xs text-slate-600 pb-8">
           <div className="mb-2">SYSTEM STATUS: NOMINAL</div>
           <div>&copy; 2026 {portfolioData.header.name} | BUILD: v2.1.0</div>
        </footer>

      </main>
    </div>
  );
}

