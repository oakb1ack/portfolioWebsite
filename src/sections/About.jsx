import { Terminal } from 'lucide-react';
import SectionHeading from '../components/SectionHeading.jsx';

export default function About({ setRef, isVisible, data }) {
  return (
    <>
      <section ref={setRef('about')} className={`section-reveal ${isVisible('about') ? 'visible' : ''} mb-28`}>
        <SectionHeading icon={Terminal} title="About" />
        <div className="card-schematic p-8 md:p-10"><p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: '72ch' }}>{data.about.content}</p></div>
      </section>
      <section ref={setRef('bio')} className={`section-reveal ${isVisible('bio') ? 'visible' : ''} mb-28`}>
        <div className="grid md:grid-cols-3 gap-4">{data.bioHighlights.map(({ label, value }) => <div key={label} className="card-schematic p-6"><p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p><p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p></div>)}</div>
      </section>
    </>
  );
}
