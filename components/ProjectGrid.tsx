import type { ReactNode } from "react";

import styles from "./ProjectGrid.module.css";

export type ProjectGridProps = {
  children: ReactNode;
  className?: string;
};

export function ProjectGrid({ children, className }: ProjectGridProps) {
  return (
    <div className={[styles.grid, className].filter(Boolean).join(" ")}>{children}</div>
  );
}
