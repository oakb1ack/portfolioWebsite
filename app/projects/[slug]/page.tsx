import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import { ButtonLink, Prose, SectionIntro } from "@/components";
import { getProjectBySlug, getProjectSlugs } from "@/lib/content";

import styles from "../../content.module.css";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return { title: "Project not found" };
  }

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}/` },
    openGraph: {
      type: "article",
      title: project.title,
      description: project.summary,
      url: `/projects/${project.slug}/`,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <article className={`container ${styles.page}`}>
      <header className={`${styles.intro} ${styles.projectHeader}`}>
        <SectionIntro
          eyebrow={project.period}
          title={project.title}
          description={project.summary}
          headingAs="h1"
        />
        <aside className={styles.projectFacts} aria-label="Project facts">
          <dl>
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{project.status === "ongoing" ? "Ongoing" : "Complete"}</dd>
            </div>
            <div>
              <dt>Result</dt>
              <dd>{project.outcome}</dd>
            </div>
          </dl>
        </aside>
      </header>

      <div className={styles.projectBody}>
        <Prose>
          <MDXRemote source={project.body} />
        </Prose>
        <aside
          className={styles.projectAside}
          aria-label="Technologies and project links"
        >
          <p className={styles.sectionLabel}>Built with</p>
          <ul className={styles.tagList}>
            {project.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
          {project.links.length ? (
            <div>
              {project.links.map((link) => (
                <ButtonLink key={link.href} href={link.href} external variant="quiet">
                  {link.label}
                </ButtonLink>
              ))}
            </div>
          ) : null}
        </aside>
      </div>

      <Link className={styles.backLink} href="/projects">
        ← Back to all projects
      </Link>
    </article>
  );
}
