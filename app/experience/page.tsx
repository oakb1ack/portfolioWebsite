import type { Metadata } from "next";

import { ButtonLink, SectionIntro } from "@/components";
import { education, experience, leadership, site } from "@/lib/data";

import styles from "../content.module.css";

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
      {entries.map((entry) => (
        <li className={styles.timelineItem} key={`${entry.organization}-${entry.role}`}>
          <h3>{entry.role}</h3>
          <p className={styles.timelineMeta}>
            <span>{entry.organization}</span>
            <span>{entry.location}</span>
            <span>{entry.period}</span>
          </p>
          <p>{entry.summary}</p>
          <ul>
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
      <SectionIntro
        className={styles.intro}
        eyebrow="Experience"
        title="Learning through research and real systems."
        description="A web-friendly view of my education, engineering experience, research, and leadership. The downloadable résumé remains the canonical record."
        headingAs="h1"
        actions={
          <ButtonLink href={site.resumeHref} external>
            Download résumé
          </ButtonLink>
        }
      />

      <section className={styles.split}>
        <p className={styles.sectionLabel}>Education</p>
        <div className={styles.copy}>
          {education.map((entry) => (
            <div key={entry.institution}>
              <h2>{entry.credential}</h2>
              <p>{entry.institution}</p>
              <p className={styles.timelineMeta}>
                <span>{entry.location}</span>
                <span>{entry.period}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.split}>
        <p className={styles.sectionLabel}>Experience</p>
        <Timeline entries={experience} />
      </section>

      <section className={styles.split}>
        <p className={styles.sectionLabel}>Leadership</p>
        <Timeline entries={leadership} />
      </section>
    </div>
  );
}
