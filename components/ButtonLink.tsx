import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./ButtonLink.module.css";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  download?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  download,
}: ButtonLinkProps) {
  return (
    <Link
      className={`${styles.button} ${styles[variant]}`}
      href={href}
      download={download}
    >
      <span>{children}</span>
      <span className={styles.arrow} aria-hidden="true">
        {download ? "↓" : "→"}
      </span>
    </Link>
  );
}
