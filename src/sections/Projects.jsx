import { Code2 } from 'lucide-react';
import ProjectFeatureCard from '../components/ProjectFeatureCard.jsx';
import SectionHeading from '../components/SectionHeading.jsx';

export default function Projects({ setRef, isVisible, projects }) {
  return <section ref={setRef('projects')} className={`section-reveal ${isVisible('projects') ? 'visible' : ''} mb-28`}><SectionHeading icon={Code2} title="Projects" /><div>{projects.map((project) => <ProjectFeatureCard key={project.name} project={project} />)}</div></section>;
}
