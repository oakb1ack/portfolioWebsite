import type { Metadata } from "next";

import { SectionIntro } from "@/components";
import { profile } from "@/lib/data";

import styles from "../content.module.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Ali Alfridawi and his interests across mathematics, electronics, and computing.",
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <div className={`container ${styles.page}`}>
      <SectionIntro
        className={styles.intro}
        eyebrow="About"
        title="I follow curiosity across disciplines."
        description={profile.introduction}
        headingAs="h1"
      />

      <section className={styles.split}>
        <p className={styles.sectionLabel}>How I think</p>
        <div className={styles.copy}>
          <h2>Understand the behavior, then build with it.</h2>
          <p>{profile.shortBio}</p>
          <p>
            Mathematics gives me tools for describing difficult systems. Electrical
            engineering grounds those ideas in physical constraints, while computing
            lets me experiment, measure, and turn them into useful systems.
          </p>
          <p>
            I am especially drawn to work where careful reasoning and practical
            engineering meet: research questions, reliable infrastructure, and systems
            that have to keep working outside the happy path.
          </p>
        </div>
      </section>

      <section className={styles.split}>
        <p className={styles.sectionLabel}>Current interests</p>
        <ul className={styles.interestList}>
          {profile.interests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
