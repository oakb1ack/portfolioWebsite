import Link from "next/link";

import styles from "./SiteHeader.module.css";

export type NavigationItem = {
  href: string;
  label: string;
  current?: boolean;
};

export type SiteHeaderProps = {
  items: readonly NavigationItem[];
  homeHref?: string;
  name?: string;
};

function NavigationLink({ item }: { item: NavigationItem }) {
  return (
    <Link
      className={styles.navLink}
      href={item.href}
      aria-current={item.current ? "page" : undefined}
    >
      {item.label}
    </Link>
  );
}

export function SiteHeader({
  items,
  homeHref = "/",
  name = "Ali Alfridawi",
}: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.identity} href={homeHref} aria-label={`${name}, home`}>
          <span className={styles.mark} aria-hidden="true">
            <span />
            <span />
          </span>
          <span>{name}</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary navigation">
          {items.map((item) => (
            <NavigationLink item={item} key={item.href} />
          ))}
        </nav>

        <details className={styles.mobileNav}>
          <summary className={styles.menuButton}>
            <span className={styles.menuLabel}>Menu</span>
            <span className={styles.menuIcon} aria-hidden="true" />
          </summary>
          <nav className={styles.mobilePanel} aria-label="Mobile navigation">
            {items.map((item) => (
              <NavigationLink item={item} key={item.href} />
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
