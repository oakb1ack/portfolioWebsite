import type { Metadata } from "next";

import { ButtonLink, SectionIntro } from "@/components";
import { site } from "@/lib/data";

import contentStyles from "../content.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Résumé",
  description:
    "View or download Ali Alfridawi's current engineering and research résumé.",
  alternates: { canonical: "/resume/" },
};

const downloadName = "Ali-Alfridawi-Resume.pdf";

export default function ResumePage() {
  return (
    <div className={`container ${contentStyles.page}`}>
      <SectionIntro
        className={contentStyles.intro}
        title="Resume"
        actions={
          <ButtonLink href={site.resumeHref} download={downloadName}>
            Download résumé
          </ButtonLink>
        }
      />

      <section className={styles.document} aria-label="Embedded résumé">
        <iframe
          className={styles.viewer}
          src={`${site.resumeHref}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          title="Ali Alfridawi's résumé"
        />
        <p className={styles.fallback}>
          If the document preview does not load, you can{" "}
          <a href={site.resumeHref} download={downloadName}>
            download the PDF directly
          </a>
          .
        </p>
      </section>
    </div>
  );
}
