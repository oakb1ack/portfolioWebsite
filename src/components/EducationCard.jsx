import { ChevronDown, Cpu } from 'lucide-react';

export default function EducationCard({ education, index, isExpanded, onToggle }) {
  const panelId = `edu-panel-${index}`;
  return (
    <div className={`card-schematic overflow-hidden education-card ${isExpanded ? 'is-open' : ''}`}>
      <button onClick={onToggle} className="education-toggle w-full px-6 py-5 text-left" aria-expanded={isExpanded} aria-controls={panelId}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`education-led ${isExpanded ? 'active' : ''}`} aria-hidden="true" />
              <h3 className="font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{education.degree}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-violet)', fontWeight: 500 }}>{education.school}</span><span>·</span><span>Class of {education.year}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0"><Cpu size={28} style={{ opacity: 0.12 }} /><ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} style={{ color: 'var(--accent-violet)' }} /></div>
        </div>
      </button>
      <div id={panelId} className={`education-expand-grid ${isExpanded ? 'open' : ''}`}>
        <div className="education-expand-inner px-6 py-5" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div className="grid gap-2 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
            {[['GPA', education.gpa], ['Focus', education.focus], ['Extracurriculars', education.extracurriculars?.join(', ')]].map(([label, value]) => <div key={label} className="education-meta-row"><span className="education-meta-label">{label}</span><span className="education-meta-value">{value}</span></div>)}
          </div>
          {[['Coursework', education.coursework], ['Honors', education.honors]].map(([label, items]) => <div key={label} className="education-tag-block mt-4"><div className="education-meta-label">{label}</div><div className="education-tag-wrap">{(items ?? []).map((item) => <span key={item} className="education-tag">{item}</span>)}</div></div>)}
        </div>
      </div>
    </div>
  );
}
