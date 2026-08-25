import type { ReactNode } from "react";

import styles from "./Callout.module.css";

export type CalloutProps = {
  title?: string;
  children: ReactNode;
  tone?: "leaf" | "pond" | "clay";
};

export function Callout({ title, children, tone = "leaf" }: CalloutProps) {
  return (
    <aside className={`${styles.callout} ${styles[tone]}`} aria-label={title ?? "Note"}>
      {title ? <p className={styles.title}>{title}</p> : null}
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
