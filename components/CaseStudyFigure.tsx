import Image from "next/image";

import styles from "./CaseStudyFigure.module.css";

export type CaseStudyFigureProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  credit?: string;
  wide?: boolean;
  priority?: boolean;
};

export function CaseStudyFigure({
  src,
  alt,
  width,
  height,
  caption,
  credit,
  wide = false,
  priority = false,
}: CaseStudyFigureProps) {
  return (
    <figure className={`${styles.figure} ${wide ? styles.wide : ""}`}>
      <div className={styles.frame}>
        <Image
          className={styles.image}
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={
            wide
              ? "(max-width: 1200px) 100vw, 1100px"
              : "(max-width: 800px) 100vw, 720px"
          }
        />
      </div>
      {caption || credit ? (
        <figcaption className={styles.caption}>
          {caption ? <span>{caption}</span> : null}
          {credit ? <span className={styles.credit}>{credit}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
