/**
 * Zweck: sichtbar machen, welchen Datenkontrakt `apps/api` gemäß
 * [ADR 0009](../../../../docs/architecture/adr/0009-lieferberechtigungen-design-system-backend-dokumentenabstraktion.md)
 * ("Lieferberechtigungen: Web-Design-System, Routing, Backend-Domäne und
 * Dokumenten-Service-Abstraktion") für Lieferberechtigungen erwartet bzw.
 * an `apps/web` ausliefert.
 *
 * Strukturell analog zu `../contracts/contract.types.ts` (ADR 0001/ADR 0002),
 * mit einer bewussten Abweichung (ADR 0009 Abschnitt 3): Das eingehende
 * Lieferanten-Schlüsselfeld heißt hier `supplierGpa`, nicht
 * `supplierExternalId` -- weil die `DeliveryAuthorization`-Domäne NACH
 * ADR 0008 (GPA als Mandantenschlüssel) neu modelliert wird.
 *
 * `AuthenticatedSupplierContext` wird bewusst NICHT erneut definiert,
 * sondern aus `../contracts/contract.types.ts` wiederverwendet -- das ist
 * bereits die im Projekt etablierte, einzige Quelle dafür (siehe
 * `../auth/auth-context.decorator.ts`, `../auth/zitadel-auth.guard.ts`).
 *
 * Was fehlt bewusst (analog contract.types.ts / contracts.service.ts):
 * - Keine echte Persistenz (DB/ORM) für `DeliveryAuthorization`.
 * - Kein Ingestion-Adapter Lobster -> apps/api (Transportmechanismus laut
 *   ADR 0009 "Offene Annahmen" explizit offen).
 * - `DeliveryAuthorizationSyncRun`/echte Sync-Historie: ADR 0009 nennt den
 *   Typ nur als "strukturell identisch zu ContractSyncRun", skizziert ihn
 *   aber nicht -- hier daher (wie in ContractsService) nur ein
 *   TODO-Platzhalterwert für `DeliveryAuthorizationSyncMeta`
 *   (siehe delivery-authorizations.controller.ts).
 *
 * Story: docs/backlog/lieferberechtigungen-anzeigen.md
 * ADR:   docs/architecture/adr/0009-lieferberechtigungen-design-system-backend-dokumentenabstraktion.md
 */

/**
 * Eingehender Datensatz, wie er laut ADR 0009 Abschnitt 3 die
 * Systemgrenze Lobster -> apps/api überqueren muss. Vertrag für einen
 * künftigen Ingestion-Adapter, NICHT das Transportformat selbst.
 */
export interface IncomingDeliveryAuthorizationRecord {
  /** Abrufnummer, fachlicher Schlüssel. */
  callOffNumber: string;
  /** GPA des Lieferanten (bewusste Abweichung von `supplierExternalId`, siehe oben). */
  supplierGpa: string;
  /** ISO-8601-Datum, Lieferdatum. */
  deliveryDate: string;
  /** "HH:mm", Uhrzeit. */
  deliveryTime: string;
  /** Sorte. */
  variety: string;
}

/**
 * Persistierte Lieferberechtigungs-Entität in `apps/api` (ADR 0009
 * Abschnitt 3: eigene Extranet-Persistenz, analog ADR 0001 Punkt 1 für
 * Kontrakte).
 */
export interface DeliveryAuthorization {
  /** Lokale Extranet-ID. */
  id: string;
  /**
   * Lokale Supplier-ID == GPA, aus `AuthenticatedSupplierContext`
   * (ADR 0008). Wird beim Zugriff ausschließlich mit der verifizierten
   * `supplierId` aus dem Auth-Kontext verglichen, niemals aus
   * Client-Eingaben übernommen (ADR 0002 Punkt 1/3, analog Kontrakte).
   */
  supplierId: string;
  callOffNumber: string;
  deliveryDate: string;
  deliveryTime: string;
  variety: string;
}

/**
 * Sync-Metadaten, die laut ADR 0009 Abschnitt 3 First-Class geführt
 * werden. Ob `apps/web` diesen Datenstand-Hinweis für Lieferberechtigungen
 * tatsächlich anzeigt, ist laut Backlog ausdrücklich offen.
 */
export interface DeliveryAuthorizationSyncMeta {
  lastSuccessfulSyncAt: string | null;
  isStale: boolean;
}

export interface DeliveryAuthorizationListResponse extends DeliveryAuthorizationSyncMeta {
  items: DeliveryAuthorization[];
}

export interface DeliveryAuthorizationDetailResponse
  extends DeliveryAuthorization,
    DeliveryAuthorizationSyncMeta {}
