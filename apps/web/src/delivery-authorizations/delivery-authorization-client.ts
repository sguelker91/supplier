/**
 * HTTP-Client-Funktionen für die Lieferberechtigungs-Endpunkte
 * (ADR 0009 Abschnitt 3) sowie den getrennten Dokumenten-Endpunkt
 * (ADR 0009 Abschnitt 8), analog `../auth/auth-client.ts::fetchMyContracts`.
 *
 * `withAuthHeader` bleibt der EINZIGE Mechanismus, über den `apps/web`
 * seine Identität gegenüber `apps/api` nachweist (siehe dortige
 * Begründung) -- niemals `supplierId` als eigenen Client-Parameter.
 */
import { withAuthHeader } from '../auth/auth-client';
import { API_BASE_URL } from '../api-client/api-config';
import type {
  DeliveryAuthorizationDetailResponse,
  DeliveryAuthorizationListResponse,
} from '../../../api/src/delivery-authorizations/delivery-authorization.types';
import type { DocumentReference } from '../../../api/src/documents/document.types';
import type { DateRangeValue } from '../design-system/DateRangeFilter';

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // AC14/ADR 0004: fehlende/abgelaufene Session -- Weiterleitung zur
    // Anmeldeseite erfolgt bereits durch `ProtectedArea`; ein 401 an
    // dieser Stelle bedeutet ein zwischenzeitlich abgelaufenes Token.
    throw new Error('Nicht authentifiziert — erneuter Login erforderlich.');
  }
  if (response.status === 403) {
    throw new Error('Zugriff verweigert.');
  }
  if (response.status === 404) {
    throw new Error('Nicht gefunden.');
  }
  if (!response.ok) {
    throw new Error(`Request fehlgeschlagen: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/** `GET /delivery-authorizations?from=&to=` (AC1/AC4/AC5). */
export async function fetchMyDeliveryAuthorizations(
  accessToken: string | undefined,
  range: DateRangeValue,
  apiBaseUrl: string = API_BASE_URL,
): Promise<DeliveryAuthorizationListResponse> {
  const url = new URL(`${apiBaseUrl}/delivery-authorizations`);
  url.searchParams.set('from', range.from);
  url.searchParams.set('to', range.to);

  const response = await fetch(url.toString(), withAuthHeader(accessToken));
  return parseJsonOrThrow<DeliveryAuthorizationListResponse>(response);
}

/** `GET /delivery-authorizations/:id` (AC10/AC11). */
export async function fetchMyDeliveryAuthorizationById(
  accessToken: string | undefined,
  id: string,
  apiBaseUrl: string = API_BASE_URL,
): Promise<DeliveryAuthorizationDetailResponse> {
  const response = await fetch(
    `${apiBaseUrl}/delivery-authorizations/${encodeURIComponent(id)}`,
    withAuthHeader(accessToken),
  );
  return parseJsonOrThrow<DeliveryAuthorizationDetailResponse>(response);
}

/**
 * `GET /documents?subjectType=delivery-authorization&subjectId=<id>`
 * (AC13, ADR 0009 Abschnitt 8) -- eigenständige, von der
 * Lieferberechtigungs-Kernabfrage getrennte Service-Schnittstelle.
 */
export async function fetchDocumentsForDeliveryAuthorization(
  accessToken: string | undefined,
  deliveryAuthorizationId: string,
  apiBaseUrl: string = API_BASE_URL,
): Promise<DocumentReference[]> {
  const url = new URL(`${apiBaseUrl}/documents`);
  url.searchParams.set('subjectType', 'delivery-authorization');
  url.searchParams.set('subjectId', deliveryAuthorizationId);

  const response = await fetch(url.toString(), withAuthHeader(accessToken));
  return parseJsonOrThrow<DocumentReference[]>(response);
}
