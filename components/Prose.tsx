import type { ReactNode } from "react";

import styles from "./Prose.module.css";

export type ProseProps = {
  children: ReactNode;
  className?: string;
};

export function Prose({ children, className }: ProseProps) {
  return (
    <div className={[styles.prose, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
