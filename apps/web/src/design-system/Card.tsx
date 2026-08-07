/**
 * Generischer Card-Container (ADR 0009 Abschnitt 1): weiße Fläche mit
 * abgerundeten Ecken/dezentem Schatten gemäß `tokens.css`, angelehnt an das
 * Info-/Listen-Card-Muster aus `Design/APP.png`.
 */
import type { ReactNode } from 'react';

import styles from './Card.module.css';

export interface CardProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function Card(props: CardProps) {
  const { title, actions, children } = props;
  const hasHeader = Boolean(title) || Boolean(actions);

  return (
    <section className={styles.card}>
      {hasHeader ? (
        <header className={styles.header}>
          {title ? <h2 className={styles.title}>{title}</h2> : <span />}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      ) : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
