import type { Metadata } from "next";

import { SectionIntro } from "@/components";
import { site } from "@/lib/data";

import styles from "../content.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Ali Alfridawi by email, GitHub, or LinkedIn.",
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  return (
    <div className={`container ${styles.page}`}>
      <SectionIntro
        className={styles.intro}
        eyebrow="Contact"
        title="Let’s compare notes."
        description="If you want to talk about research, engineering, collaboration, or an interesting problem, email is the most direct way to reach me."
        headingAs="h1"
      />
      <section className={styles.split}>
        <p className={styles.sectionLabel}>Find me</p>
        <ul className={styles.contactList}>
          <li>
            <a href={`mailto:${site.email}`}>
              <strong>Email</strong>
              <span>{site.email}</span>
            </a>
          </li>
          {site.profiles.map((profile) => (
            <li key={profile.label}>
              <a href={profile.href} target="_blank" rel="noreferrer">
                <strong>{profile.label}</strong>
                <span>{profile.handle} ↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
