import type { Metadata } from "next";

import { ProjectCard, ProjectGrid, SectionIntro } from "@/components";
import { getAllProjects } from "@/lib/content";

import styles from "../content.module.css";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected software, infrastructure, electronics, and research projects by Ali Alfridawi.",
  alternates: { canonical: "/projects/" },
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <div className={`container ${styles.page}`}>
      <SectionIntro
        className={styles.intro}
        eyebrow="Projects"
        title="Work that makes the reasoning visible."
        description="Selected projects across reliable systems, infrastructure, software, and interdisciplinary problem solving. Each case study focuses on constraints, decisions, and results."
        headingAs="h1"
      />
      <section className={styles.projectSection} aria-label="Project case studies">
        <ProjectGrid>
          {projects.map((project, index) => (
            <ProjectCard
              key={project.slug}
              href={`/projects/${project.slug}`}
              title={project.title}
              summary={project.summary}
              eyebrow={project.period}
              outcome={project.outcome}
              tags={[...project.disciplines, ...project.technologies.slice(0, 3)]}
              featured={index === 0}
            />
          ))}
        </ProjectGrid>
      </section>
    </div>
  );
}
