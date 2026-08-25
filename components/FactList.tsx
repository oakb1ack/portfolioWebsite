import styles from "./FactList.module.css";

export type Fact = {
  label: string;
  value: string;
};

export type FactListProps = {
  facts: readonly Fact[];
  ariaLabel?: string;
};

export function FactList({ facts, ariaLabel = "Project details" }: FactListProps) {
  return (
    <dl className={styles.list} aria-label={ariaLabel}>
      {facts.map((fact) => (
        <div className={styles.item} key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
