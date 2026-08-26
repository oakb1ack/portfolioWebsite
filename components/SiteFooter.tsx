import styles from "./SiteFooter.module.css";

type FooterLink = {
  href: string;
  label: string;
  external: boolean;
};

type SiteFooterProps = {
  links: readonly FooterLink[];
  name: string;
  year?: number;
  note?: string;
};

export function SiteFooter({
  links,
  name,
  year = new Date().getFullYear(),
  note = "Built with care and a little pond water.",
}: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <p className={styles.copyright}>
            © {year} {name}
          </p>
          <p className={styles.note}>{note}</p>
        </div>
        <nav className={styles.links} aria-label="Footer navigation">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
            >
              {link.label}
              {link.external ? <span aria-hidden="true">↗</span> : null}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
