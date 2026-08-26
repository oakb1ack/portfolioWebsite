import type { ReactNode } from "react";

import styles from "./SectionIntro.module.css";

type SectionIntroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function SectionIntro({
  eyebrow,
  title,
  description,
  actions,
  className,
}: SectionIntroProps) {
  const classes = [styles.intro, className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <div className={styles.copy}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h1 className={styles.title}>{title}</h1>
        {description ? <div className={styles.description}>{description}</div> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
