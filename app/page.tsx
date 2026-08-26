import Image from "next/image";

import { ButtonLink } from "@/components";
import { profile } from "@/lib/data";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.heroGrid}`}>
        <div>
          <p className={styles.eyebrow}>{profile.eyebrow}</p>
          <h1>{profile.headline}</h1>
          <p className={styles.lede}>
            I’m curious about the structures that connect mathematical models, physical
            systems, and reliable software.
          </p>
          <div className={styles.actions}>
            <ButtonLink href="/resume" variant="secondary">
              Read résumé
            </ButtonLink>
          </div>

          <dl className={styles.heroFacts}>
            <div>
              <dt>Based at</dt>
              <dd>Arlington</dd>
            </div>
            <div>
              <dt>Expected graduation</dt>
              <dd>May 2028</dd>
            </div>
          </dl>
        </div>

        <figure className={styles.artwork}>
          <div className={styles.artworkIndex} aria-hidden="true">
            Plate 01
          </div>
          <div className={styles.artworkFrame}>
            <Image
              className={styles.artworkImage}
              src="/frog-on-lotus-leaf.webp"
              alt="Frog on a lotus leaf in rain, a woodblock print by Ohara Koson."
              width={1600}
              height={1517}
              sizes="(max-width: 48rem) 92vw, 52vw"
              priority
            />
          </div>
          <figcaption>
            <span>
              <cite>Frog on lotus leaf</cite>, Ohara Koson, 1900s
            </span>
            <a
              href="https://asia-archive.si.edu/object/S2003.8.1968/"
              target="_blank"
              rel="noreferrer"
            >
              Smithsonian · CC0 ↗
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
