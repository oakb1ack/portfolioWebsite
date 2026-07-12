import { Grid } from 'lucide-react';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import BentoGroup from '../components/BentoGroup.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import { portfolioStats } from '../data/portfolioData.js';

export default function Skills({ setRef, isVisible, skills }) {
  return <section ref={setRef('skills')} className={`section-reveal ${isVisible('skills') ? 'visible' : ''} mb-28`}><SectionHeading icon={Grid} title="Skills" /><div className="bento-grid">{Object.entries(skills).map(([name, group]) => <BentoGroup key={name} groupName={name} group={group} />)}</div><div className="mt-4 px-6 py-4 card-schematic flex flex-wrap justify-between gap-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{portfolioStats.map(({ label, target, suffix, decimals, accent }) => <span key={label}>{label} <span style={{ color: `var(${accent})` }}><AnimatedCounter target={target} suffix={suffix} decimals={decimals} /></span></span>)}</div></section>;
}
