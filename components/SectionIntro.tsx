import type { ElementType, ReactNode } from "react";

import styles from "./SectionIntro.module.css";

export type SectionIntroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingAs?: "h1" | "h2" | "h3";
  align?: "left" | "center";
  className?: string;
};

export function SectionIntro({
  eyebrow,
  title,
  description,
  actions,
  headingAs = "h2",
  align = "left",
  className,
}: SectionIntroProps) {
  const Heading = headingAs as ElementType;
  const classes = [styles.intro, styles[align], className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <div className={styles.copy}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <Heading className={styles.title}>{title}</Heading>
        {description ? <div className={styles.description}>{description}</div> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
