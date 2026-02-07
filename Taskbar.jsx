import React, { useState, useRef, useEffect } from 'react';
import { Home, FileText, BookOpen, Briefcase, Code, SquareCheckBig, Mail, Terminal, Cpu, Zap } from 'lucide-react';

// Taskbar Navigation Item
const TaskbarItem = ({ icon: Icon, label, sectionRef, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`taskbar-item group relative flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isActive ? 'taskbar-item-active' : ''
      }`}
      aria-label={label}
      title={label}
    >
      {/* Icon */}
      <Icon className="w-6 h-6 transition-all duration-300 ease-out group-hover:w-7 group-hover:h-7" />

      {/* Expanding Label */}
      <span className="taskbar-label absolute left-full ml-4 px-3 py-2 bg-black/80 border border-green-500 text-green-500 text-sm font-mono opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-300 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
        {label}
      </span>

      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10" />
    </button>
  );
};

// Main Taskbar Component
export default function Taskbar({ sectionRefs }) {
  const [activeSection, setActiveSection] = useState('header');
  const [isVisible, setIsVisible] = useState(true);
  const taskbarRef = useRef(null);

  // Track which section is currently in view
  useEffect(() => {
    const handleScroll = () => {
      const sections = Object.entries(sectionRefs);
      
      for (const [sectionId, element] of sections) {
        if (element) {
          const rect = element.getBoundingClientRect();
          // Consider a section active if it's in the top 40% of viewport
          if (rect.top < window.innerHeight * 0.4 && rect.bottom > 0) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionRefs]);

  // Hide taskbar on mobile (less than 768px)
  useEffect(() => {
    const handleResize = () => {
      setIsVisible(window.innerWidth >= 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = (sectionId) => {
    const element = sectionRefs[sectionId];
    if (element) {
      const headerOffset = 0;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - headerOffset,
        behavior: 'smooth',
      });
      setActiveSection(sectionId);
    }
  };

  if (!isVisible) return null;

  return (
    <nav
      ref={taskbarRef}
      className="taskbar fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 p-3 backdrop-blur-lg bg-black/60 border-r border-green-500/50 rounded-r-sm transition-all duration-300 ease-out shadow-[5px_0_20px_rgba(0,0,0,0.5)]"
      aria-label="Section Navigation"
    >
      <TaskbarItem
        icon={Home}
        label="Home"
        sectionRef={sectionRefs.header}
        isActive={activeSection === 'header'}
        onClick={() => handleScroll('header')}
      />
      <TaskbarItem
        icon={Terminal}
        label="About"
        sectionRef={sectionRefs.about}
        isActive={activeSection === 'about'}
        onClick={() => handleScroll('about')}
      />
      <TaskbarItem
        icon={Cpu}
        label="Info"
        sectionRef={sectionRefs.bio}
        isActive={activeSection === 'bio'}
        onClick={() => handleScroll('bio')}
      />
      <TaskbarItem
        icon={BookOpen}
        label="Education"
        sectionRef={sectionRefs.education}
        isActive={activeSection === 'education'}
        onClick={() => handleScroll('education')}
      />
      <TaskbarItem
        icon={Briefcase}
        label="Experience"
        sectionRef={sectionRefs.experience}
        isActive={activeSection === 'experience'}
        onClick={() => handleScroll('experience')}
      />
      <TaskbarItem
        icon={Zap}
        label="Skills"
        sectionRef={sectionRefs.skills}
        isActive={activeSection === 'skills'}
        onClick={() => handleScroll('skills')}
      />
      <TaskbarItem
        icon={Code}
        label="Projects"
        sectionRef={sectionRefs.projects}
        isActive={activeSection === 'projects'}
        onClick={() => handleScroll('projects')}
      />
      <TaskbarItem
        icon={Mail}
        label="Contact"
        sectionRef={sectionRefs.contact}
        isActive={activeSection === 'contact'}
        onClick={() => handleScroll('contact')}
      />
    </nav>
  );
}
