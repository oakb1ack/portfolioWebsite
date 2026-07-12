import { ArrowRight, ChevronDown, Github, Linkedin } from 'lucide-react';
import headshot from '../assets/headshot.png';

export default function Hero({ setRef, data }) {
  return (
    <header ref={setRef('header')} className="hero-section">
      <div className="hero-layout">
        <div className="hero-text">
          <div className="hero-badge"><span className="hero-badge-dot" aria-hidden="true" />Available for internships · Summer 2026</div>
          <h1 className="hero-name">Ali <span className="text-gradient">Alfridawi</span></h1>
          <p className="hero-tagline">{data.header.title}</p>
          <p className="hero-bio">Building at the intersection of hardware and software. Undergraduate researcher in <span className="bio-highlight">nanophotonics</span>, developing Python simulation frameworks and exploring ML applications in optical systems.</p>
          <div className="hero-chips"><span className="chip">UTA · Class of 2029</span><span className="chip chip-accent">4.0 GPA</span><span className="chip">Research Assistant</span></div>
          <div className="hero-actions">
            <a href={`mailto:${data.contact.email}`} className="btn-primary">Get in touch <ArrowRight size={15} /></a>
            <a href={data.contact.github} target="_blank" rel="noopener noreferrer" className="btn-ghost"><Github size={16} /> GitHub</a>
            <a href={data.contact.linkedin} target="_blank" rel="noopener noreferrer" className="btn-ghost"><Linkedin size={16} /> LinkedIn</a>
          </div>
        </div>
        <div className="hero-photo-shell"><div className="hero-photo-frame"><img src={headshot} alt="Portrait of Ali Alfridawi" className="hero-photo-img" loading="eager" decoding="async" /></div></div>
      </div>
      <div className="hero-scroll-cue" aria-hidden="true"><ChevronDown size={20} /></div>
    </header>
  );
}
