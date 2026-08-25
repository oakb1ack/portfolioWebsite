import { ButtonLink, ProjectCard, ProjectGrid, SectionIntro } from "@/components";
import { getFeaturedProjects } from "@/lib/content";
import { profile } from "@/lib/data";

import styles from "./page.module.css";

export default function HomePage() {
  const projects = getFeaturedProjects();

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{profile.eyebrow}</p>
            <h1>{profile.headline}</h1>
            <p className={styles.lede}>{profile.introduction}</p>
            <div className={styles.actions}>
              <ButtonLink href="/projects">Explore my work</ButtonLink>
              <ButtonLink href="/about" variant="secondary">
                More about me
              </ButtonLink>
            </div>
          </div>
          <div className={styles.heroNote}>
            <span className={styles.lily} aria-hidden="true" />
            <p>
              Interested in the behavior of systems—from equations to electronics to
              software.
            </p>
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <SectionIntro
          eyebrow="Selected work"
          title="Projects shaped by real constraints."
          description="A mix of software, infrastructure, and interdisciplinary work, with the decisions and results made visible."
          actions={
            <ButtonLink href="/projects" variant="quiet">
              View every project
            </ButtonLink>
          }
        />
        <ProjectGrid>
          {projects.map((project, index) => (
            <ProjectCard
              key={project.slug}
              href={`/projects/${project.slug}`}
              title={project.title}
              summary={project.summary}
              eyebrow={project.period}
              outcome={project.outcome}
              tags={[...project.disciplines, ...project.technologies.slice(0, 2)]}
              featured={index === 0}
            />
          ))}
        </ProjectGrid>
      </section>

      <section className={`container ${styles.aboutBand}`}>
        <p className={styles.aboutLabel}>A little context</p>
        <div>
          <h2>I like finding the structure underneath difficult problems.</h2>
          <p>{profile.shortBio}</p>
          <ButtonLink href="/about" variant="quiet">
            Read my story
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
