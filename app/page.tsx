import { profile } from "@/lib/data";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{profile.eyebrow}</p>
          <h1>{profile.headline}</h1>
        </div>
      </div>
    </section>
  );
}
