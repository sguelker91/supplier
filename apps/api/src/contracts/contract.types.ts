/**
 * PROTOTYP / KONTURWURF — kein lauffähiger Code.
 *
 * Zweck: sichtbar machen, welchen Datenkontrakt `apps/api` gemäß
 * ADR 0001 ("Lobster-Kontraktdaten: Systemgrenze, Datenkontrakt und
 * Sync-Status") erwartet bzw. an `apps/web` ausliefert.
 *
 * Was fehlt bewusst (siehe Implementierungsnotiz in
 * docs/backlog/lieferant-kontrakte-einsehen.md):
 * - Kein NestJS-Projekt/Build (noch keine Tooling-Entscheidung laut
 *   docs/architecture/overview.md, "Offene technische Entscheidungen").
 * - Keine echte Persistenz (DB/ORM) für `Contract` / `ContractSyncRun`.
 * - Kein Ingestion-Adapter Lobster -> apps/api (Transportmechanismus
 *   laut ADR 0001 Punkt 4 explizit offen).
 * - Kein Auth-Mechanismus, der `AuthenticatedSupplierContext` befüllt
 *   (siehe ADR 0002, offene Annahme).
 *
 * Story: docs/backlog/lieferant-kontrakte-einsehen.md
 * ADRs:  docs/architecture/adr/0001-lobster-kontrakt-datenkontrakt-und-sync-status.md
 *        docs/architecture/adr/0002-mandantentrennung-kontrakte.md
 */

/** Vereinbarte Liefermenge inkl. Einheit (ADR 0001 Punkt 2). */
export interface Quantity {
  value: number;
  unit: string;
}

/**
 * Preis-/Mengenkondition für die Detailansicht (AC3).
 *
 * Bewusst generisches Line-Item-Modell (Label/Wert/Einheit), da der
 * vollständige Feldkatalog laut ADR 0001 ("Offene Annahmen") und
 * Backlog ("Offene Fragen") noch nicht geklärt ist.
 */
export interface ContractCondition {
  label: string;
  value: string;
  unit?: string;
}

/**
 * Eingehender Datensatz, wie er laut ADR 0001 Punkt 2 die
 * Systemgrenze Lobster -> apps/api überqueren muss. Dies ist der
 * Vertrag für einen künftigen Ingestion-Adapter, NICHT das
 * Transportformat selbst (Transportmechanismus laut ADR 0001 Punkt 4
 * offen).
 */
export interface IncomingContractRecord {
  contractNumber: string;
  /** ERP-seitige Lieferantenkennung, zur Zuordnung auf `Supplier`. */
  supplierExternalId: string;
  articleOrProductGroup: string;
  agreedQuantity: Quantity;
  /** ISO-8601-Datum. */
  validFrom: string;
  /** ISO-8601-Datum. */
  validTo: string;
  /**
   * Optionales ERP-seitiges Statusfeld. Laut ADR 0001 ("Offene
   * Annahmen") ist unklar, ob das ERP ein Statusfeld liefert; falls
   * nicht, wird `ContractStatus` lokal aus `validTo` abgeleitet.
   */
  status?: string;
  conditions: ContractCondition[];
}

/** Lokal berechneter/normalisierter Status (AC2, AC8). */
export type ContractStatus = 'active' | 'expired';

/**
 * Persistierte Kontrakt-Entität in `apps/api` (ADR 0001 Punkt 1:
 * apps/api ist alleiniger Datenhalter für das Extranet-Lesemodell).
 */
export interface Contract {
  /** Lokale Extranet-ID, nicht die ERP-Kontraktnummer. */
  id: string;
  /**
   * Lokale Supplier-ID. Wird beim Zugriff ausschließlich mit der
   * verifizierten `supplierId` aus dem Auth-Kontext verglichen
   * (ADR 0002 Punkt 1/3) — niemals aus Client-Eingaben übernommen.
   */
  supplierId: string;
  contractNumber: string;
  articleOrProductGroup: string;
  agreedQuantity: Quantity;
  validFrom: string;
  validTo: string;
  status: ContractStatus;
  conditions: ContractCondition[];
}

/** Sync-Status eines Lobster-Importlaufs (ADR 0001 Punkt 3). */
export type ContractSyncRunStatus = 'success' | 'failed' | 'partial';

export interface ContractSyncRun {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: ContractSyncRunStatus;
  errorInfo?: string;
}

/** Kontrakt-Zeile für die Listenansicht (AC1, AC2, AC8). */
export interface ContractListItem {
  id: string;
  contractNumber: string;
  articleOrProductGroup: string;
  agreedQuantity: Quantity;
  validFrom: string;
  validTo: string;
  status: ContractStatus;
}

/**
 * Sync-Metadaten, die JEDE Kontrakt-Leseantwort begleiten (AC6).
 * `lastSuccessfulSyncAt` ist `null`, solange noch nie erfolgreich
 * synchronisiert wurde.
 */
export interface ContractSyncMeta {
  lastSuccessfulSyncAt: string | null;
  isStale: boolean;
}

export interface ContractListResponse extends ContractSyncMeta {
  contracts: ContractListItem[];
}

export interface ContractDetailResponse extends ContractListItem, ContractSyncMeta {
  conditions: ContractCondition[];
}

/**
 * Verifizierter Auth-Kontext, aus dem laut ADR 0002 Punkt 1 die
 * `supplierId` ausschließlich abgeleitet werden darf. Wie dieser
 * Kontext technisch entsteht (Token/Session, IdP), ist laut
 * `docs/architecture/overview.md` noch nicht entschieden.
 */
export interface AuthenticatedSupplierContext {
  supplierId: string;
}
