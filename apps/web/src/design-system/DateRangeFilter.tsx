/**
 * Generischer Zeitraum-Filter (ADR 0009 Abschnitt 5). Bewusst generisch
 * (kein `DeliveryAuthorizationDateFilter`), damit künftige Listen mit
 * Zeitraum-Filterung (z. B. Abnahmescheine) dieselbe Komponente nutzen
 * können.
 */
import styles from './DateRangeFilter.module.css';

export interface DateRangeValue {
  from: string;
  to: string;
}

export interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  fromLabel?: string;
  toLabel?: string;
}

export function DateRangeFilter(props: DateRangeFilterProps) {
  const { value, onChange, fromLabel = 'Von', toLabel = 'Bis' } = props;

  return (
    <div className={styles.filter}>
      <label className={styles.field}>
        <span className={styles.label}>{fromLabel}</span>
        <input
          type="date"
          className={styles.input}
          value={value.from}
          onChange={(event) => onChange({ ...value, from: event.target.value })}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>{toLabel}</span>
        <input
          type="date"
          className={styles.input}
          value={value.to}
          onChange={(event) => onChange({ ...value, to: event.target.value })}
        />
      </label>
    </div>
  );
}
