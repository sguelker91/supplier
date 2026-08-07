/**
 * PROTOTYP / KONTURWURF -- kein lauffähiger Code, keine echte Persistenz.
 *
 * Analog zu `../contracts/contract-repository.interface.ts`: ADR 0002
 * ("Serverseitige Mandantentrennung für lieferantenscoped Ressourcen") gilt
 * unverändert auch für Lieferberechtigungen (ADR 0009 Abschnitt 3) -- JEDE
 * Abfrage muss serverseitig nach `supplierId` filterbar sein.
 *
 * `findById` liefert bewusst UNGEFILTERT nach Supplier, weil ADR 0002
 * Punkt 4 für den Detail-Zugriff zwei Prüfschritte fordert:
 * 1. Existenzprüfung (ohne Supplier-Filter) -> sonst 404
 * 2. Ownership-Prüfung (Vergleich mit Token-`supplierId`) -> sonst 403
 * Die eigentliche Fehlerentscheidung liegt in `DeliveryAuthorizationsService`,
 * nicht hier -- und wird von `DocumentsController` für die in ADR 0009
 * Abschnitt 8 geforderte zusätzliche Ownership-Prüfung wiederverwendet.
 */

import type { DeliveryAuthorization } from './delivery-authorization.types';

export interface DeliveryAuthorizationRepository {
  /**
   * Liefert ausschließlich Lieferberechtigungen des angegebenen
   * Lieferanten im angegebenen Zeitraum (inklusive Grenzen). `from`/`to`
   * sind bereits als gültige ISO-8601-Datumswerte validiert (siehe
   * `date-range.util.ts`), bevor sie hier ankommen.
   */
  findManyForSupplier(
    supplierId: string,
    range: { from: string; to: string },
  ): Promise<DeliveryAuthorization[]>;

  /**
   * Liefert eine Lieferberechtigung unabhängig vom Besitzer, oder `null`,
   * wenn sie nicht existiert. NUR für die Existenzprüfung in
   * `DeliveryAuthorizationsService` zu verwenden, niemals um Daten direkt
   * an den Client auszuliefern.
   */
  findById(id: string): Promise<DeliveryAuthorization | null>;
}
