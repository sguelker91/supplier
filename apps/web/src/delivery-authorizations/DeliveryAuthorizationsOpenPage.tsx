/**
 * Sammel-Öffnen-Ansicht (AC11, ADR 0009 Abschnitt 7): Route
 * `/delivery-authorizations/open?ids=a,b,c`. Kein eigener Backend-Batch-
 * Endpunkt -- pro ID wird derselbe `GET /delivery-authorizations/:id`-
 * Aufruf (inkl. identischem 404/403-Schutz je ID) über
 * `DeliveryAuthorizationDetailPage` ausgeführt, hier untereinander
 * dargestellt (bewusste Wahl, ADR 0009 lässt "nacheinander oder
 * untereinander" offen).
 */
import { useSearchParams } from 'react-router-dom';

import { Card } from '../design-system/Card';
import { DeliveryAuthorizationDetailPage } from './DeliveryAuthorizationDetailPage';
import styles from './DeliveryAuthorizationsOpenPage.module.css';

export function DeliveryAuthorizationsOpenPage() {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get('ids') ?? '';
  const ids = idsParam
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (ids.length === 0) {
    return (
      <Card title="Lieferberechtigungen öffnen">
        <p>Keine Lieferberechtigungen ausgewählt.</p>
      </Card>
    );
  }

  return (
    <div>
      {ids.map((id) => (
        <div key={id} className={styles.item}>
          <DeliveryAuthorizationDetailPage deliveryAuthorizationId={id} />
        </div>
      ))}
    </div>
  );
}
