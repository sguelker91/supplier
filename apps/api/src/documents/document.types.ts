/**
 * Dokumenten-Service-Abstraktion (AC13 der Story
 * `lieferberechtigungen-anzeigen`, ADR 0009 Abschnitt 8): Platzhalter/
 * Anbindungspunkt für die künftige "D3 Cloud"-Dokumenten-API, bewusst
 * GETRENNT vom `delivery-authorizations`-Modul (ERP-Zugriff über Lobster),
 * damit die reale D3-Cloud-Anbindung später ohne Änderung an der
 * Lieferberechtigungs-Kernlogik nachgerüstet werden kann.
 *
 * Keine Spekulation über D3-Cloud-Interna (Authentifizierung, Datenformat,
 * Fehlerverhalten bei Nichterreichbarkeit, vollständiges Feld-Set von
 * `DocumentReference`) -- siehe ADR 0009 "Offene Annahmen".
 *
 * Story: docs/backlog/lieferberechtigungen-anzeigen.md
 * ADR:   docs/architecture/adr/0009-lieferberechtigungen-design-system-backend-dokumentenabstraktion.md
 */

/** Erweiterbar, sobald weitere fachliche Objekte Dokumente erhalten. */
export type DocumentSubjectType = 'delivery-authorization';

export interface DocumentSubjectReference {
  subjectType: DocumentSubjectType;
  /** Lokale Extranet-ID des fachlichen Objekts. */
  subjectId: string;
}

export interface DocumentReference {
  id: string;
  name: string;
  // Weitere Felder (Typ, Größe, Download-Mechanismus) bewusst offen --
  // unbekannt, bis die reale D3-Cloud-API vorliegt (siehe Offene Annahmen).
}

export interface DocumentProvider {
  listDocuments(subject: DocumentSubjectReference): Promise<DocumentReference[]>;
}
