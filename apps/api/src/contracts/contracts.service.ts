/**
 * PROTOTYP / KONTURWURF — kein lauffähiger Code.
 *
 * Zeigt die fachliche Logik, die laut ADR 0002 für die
 * lieferantenscoped Kontrakt-Endpunkte (`GET /contracts`,
 * `GET /contracts/:contractId`) serverseitig durchgesetzt werden
 * muss: `supplierId` kommt ausschließlich aus dem verifizierten Auth-
 * Kontext (nie aus Pfad-/Query-/Body-Parametern), und der 403-vs-404-
 * Unterschied bei Detailzugriff (ADR 0002 Punkt 4).
 *
 * Was hier bewusst fehlt (kein Framework-Setup, siehe
 * docs/architecture/overview.md, "Offene technische Entscheidungen"):
 * - Keine NestJS-Decorators (`@Injectable`, `@Controller`, `@Get`,
 *   Guards) — sobald das Framework gesetzt ist, wird dies zu einem
 *   echten Nest-Service inkl. Controller + AuthGuard.
 * - Keine echte `ContractRepository`-Implementierung (DB/ORM).
 * - Kein Mapping auf `ContractListResponse`/`ContractDetailResponse`
 *   inkl. `lastSuccessfulSyncAt`/`isStale` aus `ContractSyncRun`
 *   (siehe contract.types.ts) — hier nur als TODO markiert, damit der
 *   Kern (Autorisierung) im Fokus bleibt.
 */

import type { AuthenticatedSupplierContext, Contract } from './contract.types';
import type { ContractRepository } from './contract-repository.interface';

export type ContractDetailResult =
  | { kind: 'ok'; contract: Contract }
  | { kind: 'not_found' }
  | { kind: 'forbidden' };

export class ContractsService {
  constructor(private readonly contracts: ContractRepository) {}

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
