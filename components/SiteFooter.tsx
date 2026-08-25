import Link from "next/link";

import styles from "./SiteFooter.module.css";

export type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
};

export type SiteFooterProps = {
  links: readonly FooterLink[];
  name?: string;
  year?: number;
  note?: string;
};

export function SiteFooter({
  links,
  name = "Ali Alfridawi",
  year = new Date().getFullYear(),
  note = "Built with care and a little pond water.",
}: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.pond} aria-hidden="true">
        <span className={styles.lily} />
        <span className={styles.frog}>
          <i />
          <i />
        </span>
      </div>
      <div className={styles.inner}>
        <div>
          <p className={styles.copyright}>
            © {year} {name}
          </p>
          <p className={styles.note}>{note}</p>
        </div>
        <nav className={styles.links} aria-label="Footer navigation">
          {links.map((link) =>
            link.external ? (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
                <span aria-hidden="true">↗</span>
              </a>
            ) : link.href.startsWith("mailto:") ? (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}
