/**
 * PROTOTYP / KONTURWURF — kein lauffähiger Code, keine echte Persistenz.
 *
 * Dieses Interface macht sichtbar, welche Zugriffsmuster ADR 0002
 * ("Serverseitige Mandantentrennung für lieferantenscoped Ressourcen")
 * für die Datenzugriffsebene vorschreibt: JEDE Kontrakt-Abfrage muss
 * serverseitig nach `supplierId` filterbar sein (Defense-in-Depth,
 * ADR 0002 Punkt 3).
 *
 * `findById` liefert bewusst UNGEFILTERT nach Supplier, weil ADR 0002
 * Punkt 4 für den Detail-Zugriff zwei Prüfschritte fordert:
 * 1. Existenzprüfung (ohne Supplier-Filter) -> sonst 404
 * 2. Ownership-Prüfung (Vergleich mit Token-`supplierId`) -> sonst 403
 * Die eigentliche Fehlerentscheidung liegt in `ContractsService`
 * (siehe contracts.service.ts), nicht hier.
 */

import type { Contract } from './contract.types';

export interface ContractRepository {
  /** Liefert ausschließlich Kontrakte des angegebenen Lieferanten. */
  findManyForSupplier(supplierId: string): Promise<Contract[]>;

  /**
   * Liefert einen Kontrakt unabhängig vom Besitzer, oder `null`, wenn
   * er nicht existiert. NUR für die Existenzprüfung in
   * `ContractsService` zu verwenden, niemals um Daten direkt an den
   * Client auszuliefern.
   */
  findById(contractId: string): Promise<Contract | null>;
}
