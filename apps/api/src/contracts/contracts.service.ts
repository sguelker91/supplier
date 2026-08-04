/**
 * Fachliche Logik, die laut ADR 0002 für die lieferantenscoped
 * Kontrakt-Endpunkte (`GET /contracts`, `GET /contracts/:contractId`)
 * serverseitig durchgesetzt werden muss: `supplierId` kommt
 * ausschließlich aus dem verifizierten Auth-Kontext (nie aus
 * Pfad-/Query-/Body-Parametern), und der 403-vs-404-Unterschied bei
 * Detailzugriff (ADR 0002 Punkt 4).
 *
 * Kernlogik bewusst unverändert gegenüber dem ursprünglichen Konturwurf
 * -- lediglich mit `@Injectable()`/`@Inject()` ans NestJS-Modulsystem
 * angeschlossen (siehe `contracts.module.ts`).
 *
 * Was weiterhin bewusst fehlt/TODO bleibt:
 * - `ContractRepository` ist aktuell nur durch eine In-Memory-Übergangs-
 *   lösung implementiert (siehe `in-memory-contract.repository.ts`),
 *   keine echte DB/ORM-Anbindung (keine Datenbank-ADR vorhanden).
 * - Kein Mapping auf `ContractListResponse`/`ContractDetailResponse`
 *   inkl. `lastSuccessfulSyncAt`/`isStale` aus `ContractSyncRun`
 *   (siehe contract.types.ts) — hier nur als TODO markiert, damit der
 *   Kern (Autorisierung) im Fokus bleibt.
 */

import { Inject, Injectable } from '@nestjs/common';

import type { AuthenticatedSupplierContext, Contract } from './contract.types';
import { CONTRACT_REPOSITORY } from './contract-repository.token';
import type { ContractRepository } from './contract-repository.interface';

export type ContractDetailResult =
  | { kind: 'ok'; contract: Contract }
  | { kind: 'not_found' }
  | { kind: 'forbidden' };

@Injectable()
export class ContractsService {
  constructor(@Inject(CONTRACT_REPOSITORY) private readonly contracts: ContractRepository) {}

  /**
   * AC1/AC2/AC5: Liste "meiner" Kontrakte. `supplierId` stammt
   * ausschließlich aus dem verifizierten Auth-Kontext (ADR 0002
   * Punkt 1); ein leeres Array ist ein gültiges Ergebnis (AC5 -
   * Leer-Zustand wird von apps/web dargestellt, nicht als Fehler).
   *
   * TODO (Konturwurf): Sync-Metadaten (`lastSuccessfulSyncAt`,
   * `isStale`) aus `ContractSyncRun` ermitteln und in die
   * Response-Hülle einfügen (ADR 0001 Punkt 3).
   */
  async listMyContracts(auth: AuthenticatedSupplierContext): Promise<Contract[]> {
    return this.contracts.findManyForSupplier(auth.supplierId);
  }

  /**
   * AC3/AC4: Detailansicht "meines" Kontrakts, mit dem in ADR 0002
   * Punkt 4 festgelegten Statuscode-Verhalten:
   * - Kontrakt existiert nicht            -> 'not_found' (404)
   * - Kontrakt existiert, fremder Besitzer -> 'forbidden' (403)
   * - Kontrakt existiert und gehört mir    -> 'ok'
   *
   * Kontraktdaten werden im 'forbidden'-Fall NICHT zurückgegeben.
   */
  async getMyContractById(
    contractId: string,
    auth: AuthenticatedSupplierContext,
  ): Promise<ContractDetailResult> {
    const contract = await this.contracts.findById(contractId);

    if (!contract) {
      return { kind: 'not_found' };
    }

    if (contract.supplierId !== auth.supplierId) {
      return { kind: 'forbidden' };
    }

    return { kind: 'ok', contract };
  }
}
