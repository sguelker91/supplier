/**
 * Detailansicht einer einzelnen Lieferberechtigung (AC10, ADR 0009
 * Abschnitt 7: "Öffnen" navigiert clientseitig hierher statt Modal/
 * Download). Lädt die Kerndaten über `GET /delivery-authorizations/:id`
 * und versucht ZUSÄTZLICH, NICHT-BLOCKIEREND, zugehörige Dokumente über
 * die getrennte `/documents`-Service-Schnittstelle nachzuladen (AC13,
 * ADR 0009 Abschnitt 8) -- ein Fehlschlag/leeres Ergebnis dort verhindert
 * NICHT die Anzeige der Kerndaten.
 *
 * Fachlicher Inhalt über die vier Pflichtspalten hinaus ist laut Backlog
 * ("Offene Fragen") nicht geklärt -- diese Ansicht zeigt daher bewusst nur
 * die bekannten Kernfelder.
 */
import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { Link, useParams } from 'react-router-dom';

import type { DeliveryAuthorizationDetailResponse } from '../../../api/src/delivery-authorizations/delivery-authorization.types';
import type { DocumentReference } from '../../../api/src/documents/document.types';
import { Card } from '../design-system/Card';
import {
  fetchDocumentsForDeliveryAuthorization,
  fetchMyDeliveryAuthorizationById,
} from './delivery-authorization-client';

export interface DeliveryAuthorizationDetailPageProps {
  /** Primär für Tests bzw. die Sammel-Öffnen-Ansicht; sonst aus der Route (`:id`). */
  deliveryAuthorizationId?: string;
  fetchDeliveryAuthorization?: (id: string) => Promise<DeliveryAuthorizationDetailResponse>;
  fetchDocuments?: (id: string) => Promise<DocumentReference[]>;
}

export function DeliveryAuthorizationDetailPage(props: DeliveryAuthorizationDetailPageProps) {
  const params = useParams<{ id: string }>();
  const auth = useAuth();
  const id = props.deliveryAuthorizationId ?? params.id ?? '';

  const [deliveryAuthorization, setDeliveryAuthorization] =
    useState<DeliveryAuthorizationDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentReference[]>([]);

  const loadDeliveryAuthorization =
    props.fetchDeliveryAuthorization ??
    ((theId: string) => fetchMyDeliveryAuthorizationById(auth.user?.access_token, theId));
  const loadDocuments =
    props.fetchDocuments ?? ((theId: string) => fetchDocumentsForDeliveryAuthorization(auth.user?.access_token, theId));

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    loadDeliveryAuthorization(id)
      .then((result) => {
        if (!cancelled) {
          setDeliveryAuthorization(result);
        }
      })
      .catch((caughtError: unknown) => {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Lieferberechtigung konnte nicht geladen werden.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    // AC13: eigenständige, nicht-blockierende Dokumentenanzeige über die
    // getrennte Service-Schnittstelle -- Fehler hier werden bewusst
    // stillschweigend ignoriert (keine echten Dokumente == leere Liste ist
    // ein gültiger, nicht fehlerhafter Zustand für den heutigen
    // `StubDocumentProvider`).
    loadDocuments(id)
      .then((result) => {
        if (!cancelled) {
          setDocuments(result);
        }
      })
      .catch(() => {
        // bewusst stillschweigend, siehe Kommentar oben.
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) {
    return <p role="status">Lieferberechtigung wird geladen…</p>;
  }

  if (error || !deliveryAuthorization) {
    return <p role="alert">{error ?? 'Lieferberechtigung konnte nicht geladen werden.'}</p>;
  }

  return (
    <Card title={`Lieferberechtigung ${deliveryAuthorization.callOffNumber}`}>
      <dl>
        <dt>Abrufnummer</dt>
        <dd>{deliveryAuthorization.callOffNumber}</dd>
        <dt>Lieferdatum</dt>
        <dd>{deliveryAuthorization.deliveryDate}</dd>
        <dt>Uhrzeit</dt>
        <dd>{deliveryAuthorization.deliveryTime}</dd>
        <dt>Sorte</dt>
        <dd>{deliveryAuthorization.variety}</dd>
      </dl>

      <section>
        <h3>Dokumente</h3>
        {documents.length === 0 ? (
          <p>Keine Dokumente vorhanden.</p>
        ) : (
          <ul>
            {documents.map((document) => (
              <li key={document.id}>{document.name}</li>
            ))}
          </ul>
        )}
      </section>

      <Link to="/delivery-authorizations">Zurück zur Liste</Link>
    </Card>
  );
}
