import type { Metadata } from "next";

import { site } from "@/lib/data";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Ali Alfridawi by email, GitHub, or LinkedIn.",
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.hero}>
        <div className={styles.intro}>
          <h1>Get in touch.</h1>
          <p className={styles.lede}>
            Email is the best way to reach me about research, engineering, or
            collaboration.
          </p>
        </div>

        <a
          className={styles.emailCard}
          href={`mailto:${site.email}`}
          aria-label={`Email ${site.name} at ${site.email}`}
        >
          <span className={styles.emailTopline}>
            <span>Email</span>
            <span className={styles.cardArrow} aria-hidden="true">
              ↗
            </span>
          </span>
          <span className={styles.emailPrompt}>Send an email</span>
          <span className={styles.emailAddress}>{site.email}</span>
        </a>
      </header>

      <section className={styles.elsewhere} aria-labelledby="elsewhere-heading">
        <div className={styles.sectionIntro}>
          <h2 id="elsewhere-heading">Other profiles.</h2>
        </div>

        <ul className={styles.profileGrid}>
          {site.profiles.map((profile, index) => (
            <li key={profile.label}>
              <a href={profile.href} target="_blank" rel="noreferrer">
                <span className={styles.profileNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.profileCopy}>
                  <strong>{profile.label}</strong>
                  <span>{profile.handle}</span>
                </span>
                <span className={styles.profileArrow} aria-hidden="true">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
