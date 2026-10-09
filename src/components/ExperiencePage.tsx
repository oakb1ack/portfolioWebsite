import type { MouseEventHandler, RefObject } from 'react';
import { experiences } from '../data/experience';
import { CrimsonBranch } from './DialogueDetails';
import { CodexDivider, RecordCorners, StatusSigil } from './ExperienceOrnaments';

export function ExperiencePage({ headingRef, onReturn }: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  onReturn: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <main className="experience-page page-enter" aria-labelledby="experience-heading">
      <a className="back-button" href="/" onClick={onReturn}><span className="experience-return-mark" aria-hidden="true">«</span> Return to the house</a>
      <div className="experience-content">
        <header className="experience-heading">
          <div className="experience-title">
            <CrimsonBranch />
            <h1 id="experience-heading" ref={headingRef} tabIndex={-1}>Experience</h1>
          </div>
          <CodexDivider />
        </header>
        <ul className="experience-list">
          {experiences.map(experience => (
            <li key={experience.id}>
              <article className="experience-entry" aria-labelledby={`experience-${experience.id}`}>
                <RecordCorners />
                <header className="experience-entry-heading">
                  <h2 id={`experience-${experience.id}`}>{experience.company}</h2>
                  {experience.status && <span className="experience-status"><StatusSigil /> {experience.status}</span>}
                  {experience.period && <p className="experience-period">{experience.period}</p>}
                </header>
                <div className="experience-entry-body">
                  <h3 className="experience-role">{experience.role}</h3>
                  {experience.organization && <p className="experience-organization">{experience.organization}</p>}
                  <p className="experience-description">{experience.description}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
