import type { Metadata } from "next";

import { ButtonLink } from "@/components";
import { education, experience, leadership, site } from "@/lib/data";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Experience",
  description:
    "Education, engineering experience, research, and leadership from Ali Alfridawi.",
  alternates: { canonical: "/experience/" },
};

type Entry = (typeof experience)[number] | (typeof leadership)[number];

function Timeline({ entries }: { entries: readonly Entry[] }) {
  return (
    <ol className={styles.timeline}>
      {entries.map((entry, index) => (
        <li className={styles.timelineItem} key={`${entry.organization}-${entry.role}`}>
          <span className={styles.entryNumber} aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className={styles.entryBody}>
            <p className={styles.organization}>{entry.organization}</p>
            <h3>{entry.role}</h3>
            <p className={styles.summary}>{entry.summary}</p>
          </div>
          <p className={styles.entryMeta}>
            <span>{entry.period}</span>
            <span>{entry.location}</span>
          </p>
          <ul className={styles.highlights}>
            {entry.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export default function ExperiencePage() {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.hero}>
        <div className={styles.intro}>
          <h1>Experience</h1>
          <p>
            My work spans software engineering, undergraduate research, and technical
            leadership.
          </p>
        </div>
        <div className={styles.heroAction}>
          <ButtonLink
            href={site.resumeHref}
            download="Ali-Alfridawi-Resume.pdf"
            variant="secondary"
          >
            Download résumé
          </ButtonLink>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="education-heading">
        <div className={styles.sectionHeading}>
          <h2 id="education-heading">Education</h2>
        </div>
        <div className={styles.educationGrid}>
          {education.map((entry) => (
            <article className={styles.educationCard} key={entry.institution}>
              <div>
                <p className={styles.institution}>{entry.institution}</p>
                <h3>{entry.credential}</h3>
              </div>
              <dl className={styles.educationMeta}>
                <div>
                  <dt>Location</dt>
                  <dd>{entry.location}</dd>
                </div>
                <div>
                  <dt>Graduation</dt>
                  <dd>{entry.period}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="work-heading">
        <div className={styles.sectionHeading}>
          <h2 id="work-heading">Work &amp; research</h2>
          <p>{experience.length} roles</p>
        </div>
        <Timeline entries={experience} />
      </section>

      <section className={styles.section} aria-labelledby="leadership-heading">
        <div className={styles.sectionHeading}>
          <h2 id="leadership-heading">Leadership</h2>
          <p>{leadership.length} roles</p>
        </div>
        <Timeline entries={leadership} />
      </section>
    </div>
  );
}
