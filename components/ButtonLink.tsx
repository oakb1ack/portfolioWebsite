import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./ButtonLink.module.css";

export type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "quiet";
  external?: boolean;
  download?: string;
  className?: string;
  ariaLabel?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  external = false,
  download,
  className,
  ariaLabel,
}: ButtonLinkProps) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(" ");
  const content = (
    <>
      <span>{children}</span>
      <span className={styles.arrow} aria-hidden="true">
        {download ? "↓" : external ? "↗" : "→"}
      </span>
    </>
  );

  if (external) {
    return (
      <a
        className={classes}
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={ariaLabel}
      >
        {content}
      </a>
    );
  }

  return (
    <Link className={classes} href={href} aria-label={ariaLabel} download={download}>
      {content}
    </Link>
  );
}
