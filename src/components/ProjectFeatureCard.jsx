import { ExternalLink, Github } from 'lucide-react';
import { iconRegistry } from '../data/icons.js';

export default function ProjectFeatureCard({ project }) {
  const ProjectIcon = project.icon ? iconRegistry[project.icon === 'bot' ? 'Bot' : 'FileText'] : null;
  return (
    <div className="project-feature-card">
      <div className="project-mockup" style={{ background: project.mockupGradient }}><div className="project-mockup-icon" style={{ background: project.mockupIconBg }}>{ProjectIcon && <ProjectIcon size={26} color="#fff" />}</div><div className="project-mockup-label">{project.label}</div></div>
      <div className="project-content">
        <div className="project-content-header"><h3>{project.name}</h3><span className="chip chip-accent" style={{ flexShrink: 0 }}>{project.status}</span></div>
        <p className="project-description">{project.shortDescription}</p>
        <div className="project-features-list">{project.features.map((feature) => <div key={feature} className="project-feature-item"><span className="project-feature-bullet" aria-hidden="true" />{feature}</div>)}</div>
        <div className="project-tech-row">{project.technologies.map((technology) => <span key={technology} className="project-tech-pill">{technology}</span>)}</div>
        <div className="project-footer"><a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: '0.85rem', padding: '8px 16px' }}><Github size={15} />View Source<ExternalLink size={12} style={{ opacity: 0.5 }} /></a></div>
      </div>
    </div>
  );
}
