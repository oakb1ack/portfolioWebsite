import { ButtonLink, SectionIntro } from "@/components";

import styles from "./content.module.css";

export default function NotFound() {
  return (
    <div className={`container ${styles.page}`}>
      <SectionIntro
        className={styles.intro}
        eyebrow="404 · off the lily pad"
        title="This page wandered out of the pond."
        description="The link may be old, or the page may have moved. The homepage is a good place to find your footing again."
        headingAs="h1"
        actions={<ButtonLink href="/">Return home</ButtonLink>}
      />
    </div>
  );
}
