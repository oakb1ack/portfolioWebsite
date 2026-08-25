import Image from "next/image";
import Link from "next/link";

import styles from "./ProjectCard.module.css";

export type ProjectCardImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
};

export type ProjectCardProps = {
  href: string;
  title: string;
  summary: string;
  image?: ProjectCardImage;
  tags?: readonly string[];
  eyebrow?: string;
  outcome?: string;
  featured?: boolean;
};

export function ProjectCard({
  href,
  title,
  summary,
  image,
  tags = [],
  eyebrow,
  outcome,
  featured = false,
}: ProjectCardProps) {
  return (
    <article className={`${styles.card} ${featured ? styles.featured : ""}`}>
      <Link
        className={styles.coverLink}
        href={href}
        aria-label={`Read ${title} case study`}
      >
        <div className={styles.media}>
          {image ? (
            <Image
              className={styles.image}
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              priority={image.priority}
              sizes={
                featured
                  ? "(max-width: 720px) 100vw, 65vw"
                  : "(max-width: 720px) 100vw, 40vw"
              }
            />
          ) : (
            <span className={styles.placeholder} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          )}
        </div>
      </Link>
      <div className={styles.body}>
        <div className={styles.metaRow}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : <span />}
          {outcome ? <p className={styles.outcome}>{outcome}</p> : null}
        </div>
        <h3 className={styles.title}>
          <Link href={href}>
            {title}
            <span aria-hidden="true">↗</span>
          </Link>
        </h3>
        <p className={styles.summary}>{summary}</p>
        {tags.length ? (
          <ul className={styles.tags} aria-label={`${title} disciplines and tools`}>
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
