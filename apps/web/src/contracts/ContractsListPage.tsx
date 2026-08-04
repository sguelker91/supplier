/**
 * PROTOTYP / KONTURWURF — kein lauffähiger Code, keine echte React-App.
 *
 * Zweck: sichtbar machen, wie `apps/web` die Kontrakt-Liste laut
 * ADR 0001 (Datenkontrakt inkl. Sync-Metadaten) und den
 * Akzeptanzkriterien AC1/AC2/AC5/AC6/AC8 rendern würde. Es gibt noch
 * kein Web-Framework-Setup (React/Build-Tooling ist laut
 * docs/architecture/overview.md, "Offene technische Entscheidungen",
 * nicht entschieden) — diese Datei kompiliert daher nicht ohne
 * ein React-Projekt (package.json, `react`-Dependency, Bundler).
 *
 * Was hier bewusst fehlt:
 * - Kein Routing/Menüpunkt "Kontrakte" (AC1).
 * - Kein echter HTTP-Client gegen `GET /contracts` in `apps/api`.
 * - Keine Weiterleitung zur Anmeldeseite bei fehlender/abgelaufener
 *   Session (AC7) — das hängt am noch offenen Auth-Mechanismus.
 * - Keine Detailansicht (AC3) und keine 403-Fehlerbehandlung bei
 *   direkter URL-Manipulation (AC4) — das ist serverseitig in
 *   apps/api/src/contracts/contracts.service.ts skizziert und müsste
 *   hier lediglich konsumiert werden.
 * - Keine Tests (kein Test-Framework entschieden).
 *
 * Story: docs/backlog/lieferant-kontrakte-einsehen.md
 */

// Platzhalter-Importe: `react` ist in diesem Repo noch nicht als
// Dependency vorhanden (kein package.json/Web-Scaffolding). Sobald
// das Web-Tooling entschieden ist, wird dies ein echter Import.
// import { useEffect, useState } from 'react';

import type {
  ContractListItem,
  ContractListResponse,
} from '../../../api/src/contracts/contract.types';

/**
 * Sehr einfache, ungestylte Skizze der Listenansicht. Zeigt die laut
 * ADR 0001/AC2 mindestens erforderlichen Spalten sowie die
 * AC5- (Leer-Zustand) und AC6/AC8- (Sync-Hinweis, "abgelaufen")
 * Anforderungen.
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
    // hier nur rudimentär über data-Attribut/Klasse angedeutet — echtes
    // Styling ist Teil der UI-Umsetzung, nicht dieses Konturwurfs.
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
