/**
 * Zeigt, wie `apps/web` die Kontrakt-Liste laut ADR 0001 (Datenkontrakt
 * inkl. Sync-Metadaten) und den Akzeptanzkriterien AC1/AC2/AC5/AC6/AC8
 * rendert. Jetzt eine echte, renderbare React-Komponente (React + Vite,
 * siehe `vite.config.ts`).
 *
 * Bewusst weiterhin nicht Teil dieser Komponente (siehe Implementierungs-
 * notizen in docs/backlog/lieferant-kontrakte-einsehen.md):
 * - Kein Routing/Menüpunkt "Kontrakte" (AC1) -- reine Präsentationskomponente,
 *   die ihre Daten als Prop erhält.
 * - Kein echter HTTP-Client-Aufruf gegen `GET /contracts` -- das Laden der
 *   Daten (inkl. AC7-Redirect bei fehlender/abgelaufener Session) hängt am
 *   noch offenen OIDC-Login-Flow (ADR 0004, `auth-client.ts` bleibt TODO).
 * - Keine Detailansicht (AC3) und keine 403-Fehlerbehandlung bei direkter
 *   URL-Manipulation (AC4) -- das ist serverseitig bereits umgesetzt
 *   (`apps/api/src/contracts/contracts.controller.ts`) und müsste hier nur
 *   konsumiert werden, sobald Routing/Daten-Fetching entschieden ist.
 *
 * Story: docs/backlog/lieferant-kontrakte-einsehen.md
 */

import type { ContractListItem, ContractListResponse } from '../../../api/src/contracts/contract.types';

/**
 * Listenansicht. Zeigt die laut ADR 0001/AC2 mindestens erforderlichen
 * Spalten sowie die AC5- (Leer-Zustand) und AC6/AC8- (Sync-Hinweis,
 * "abgelaufen") Anforderungen.
 */
export function ContractsListPage(props: { data: ContractListResponse }) {
  const { contracts, lastSuccessfulSyncAt, isStale } = props.data;

  return (
    <section>
      <h1>Kontrakte</h1>

      {/* AC6: Hinweis auf Datenstand, insbesondere wenn veraltet. */}
      <p role="status">
        {lastSuccessfulSyncAt
          ? `Letzte erfolgreiche Aktualisierung: ${lastSuccessfulSyncAt}`
          : 'Noch keine erfolgreiche Datenaktualisierung vorhanden.'}
        {isStale ? ' (Achtung: Daten möglicherweise veraltet)' : null}
      </p>

      {/* AC5: klarer Leer-Zustand statt leerem Bildschirm. */}
      {contracts.length === 0 ? (
        <p>Keine Kontrakte vorhanden.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Kontraktnummer</th>
              <th>Artikel/Warengruppe</th>
              <th>Menge</th>
              <th>Gültig von</th>
              <th>Gültig bis</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <ContractRow key={contract.id} contract={contract} />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function ContractRow(props: { contract: ContractListItem }) {
  const { contract } = props;
  const isExpired = contract.status === 'expired';

  return (
    // AC8: abgelaufene Kontrakte müssen eindeutig erkennbar sein,
    // hier über data-Attribut/Klasse sowie sichtbaren Text angedeutet --
    // vollständiges visuelles Styling ist nicht Teil dieser Aufgabe.
    <tr data-status={contract.status} className={isExpired ? 'contract-expired' : undefined}>
      <td>{contract.contractNumber}</td>
      <td>{contract.articleOrProductGroup}</td>
      <td>
        {contract.agreedQuantity.value} {contract.agreedQuantity.unit}
      </td>
      <td>{contract.validFrom}</td>
      <td>{contract.validTo}</td>
      <td>{isExpired ? 'abgelaufen' : 'aktiv'}</td>
    </tr>
  );
}
