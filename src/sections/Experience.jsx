import { Zap } from 'lucide-react';
import SectionHeading from '../components/SectionHeading.jsx';

export default function Experience({ setRef, isVisible, experience }) {
  return <section ref={setRef('experience')} className={`section-reveal ${isVisible('experience') ? 'visible' : ''} mb-28`}><SectionHeading icon={Zap} title="Experience" /><div className="experience-timeline">{experience.map((item) => <div key={`${item.role}-${item.company}`} className="experience-item"><span className="experience-dot" aria-hidden="true" /><div className="experience-card"><div className="experience-card-top"><span className="experience-role">{item.role}</span><span className="chip font-mono text-xs flex-shrink-0">{item.date}</span></div><p className="experience-company">{item.company}</p><p className="experience-description">{item.description}</p><div className="experience-tech-row">{item.technologies.map((technology) => <span key={technology} className="project-tech-pill">{technology}</span>)}</div></div></div>)}</div></section>;
}
