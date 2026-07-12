import { useState } from 'react';
import EducationCard from '../components/EducationCard.jsx';
import SectionHeading from '../components/SectionHeading.jsx';

export default function Education({ setRef, isVisible, education }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  return <section ref={setRef('education')} className={`section-reveal ${isVisible('education') ? 'visible' : ''} mb-28`}><SectionHeading title="Education"><span style={{ fontWeight: 800, fontSize: '0.85rem' }}>E</span></SectionHeading><div className="space-y-4">{education.map((item, index) => <EducationCard key={`${item.school}-${index}`} education={item} index={index} isExpanded={expandedIndex === index} onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)} />)}</div></section>;
}
