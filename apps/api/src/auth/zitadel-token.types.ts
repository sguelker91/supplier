/**
 * Bildet den Token-Vertrag ab, den ADR 0004 ("ZITADEL Cloud als
 * OIDC-Identity-Provider für Lieferanten-Authentifizierung") Punkt 2/3 für
 * das von ZITADEL ausgestellte, signierte ID-/Access-Token voraussetzt,
 * präzisiert um die in ADR 0008 ("GPA als Mandanten-Schlüssel,
 * Mehrfachanmeldungen pro GPA und Okta als föderierter MFA-Provider")
 * entschiedenen Erweiterungen: Der Organization-Claim referenziert
 * fachlich die Geschäftspartnernummer (GPA), und ein zusätzlicher
 * `userType`-Claim wird transportiert (ohne Autorisierungswirkung).
 *
 * Story-Kontext: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 * ADR 0002 (Mandantentrennung): docs/architecture/adr/0002-mandantentrennung-kontrakte.md
 * ADR 0008 (GPA/Mehrfachanmeldung/Okta): docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */

import type { SupplierUserType } from './user-type';

/**
 * Rohe, noch UNVERIFIZIERTE Token-Claims, wie sie strukturell in einem von
 * ZITADEL Cloud ausgestellten JWT erwartet werden (Standard-OIDC-Claims
 * plus Organization-Zugehörigkeit).
 *
 * WICHTIG (offenes Detail, siehe ADR 0004 Punkt 3 / "Offene Annahmen"): Der
 * exakte Claim-Name, unter dem ZITADEL die Organization-Zugehörigkeit im
 * Token mitführt, ist projekt-/konfigurationsabhängig (abhängig von der
 * konkreten ZITADEL-Projekt-/Actions-/Custom-Claims-Konfiguration, die laut
 * ADR 0004 noch nicht spezifiziert ist). Dieses Interface listet die
 * plausibelsten Varianten als Platzhalter auf; welche davon tatsächlich
 * zutrifft, muss beim realen ZITADEL-Projekt-Setup verifiziert werden.
 */
export interface RawZitadelTokenPayload {
  /** Standard-OIDC: Subject, eindeutige ZITADEL-Nutzer-ID. */
  sub: string;
  /** Standard-OIDC: ausstellende ZITADEL-Instanz-URL. */
  iss: string;
  /** Standard-OIDC: erwartete Audience (Client-ID der jeweiligen App). */
  aud: string | string[];
  /** Standard-OIDC: Ablaufzeit (Unix-Timestamp, Sekunden). */
  exp: number;
  /** Standard-OIDC: Ausstellungszeit (Unix-Timestamp, Sekunden). */
  iat: number;
  email?: string;
  email_verified?: boolean;
  /**
   * PLATZHALTER: möglicher Custom-Claim für die ZITADEL-Organization-ID.
   * Name/Vorhandensein hängt von der ZITADEL-Projektkonfiguration ab
   * (siehe ADR 0004 "Offene Annahmen"). Seit ADR 0008 gilt fachlich: Jede
   * ZITADEL-Organization wird 1:1 pro Geschäftspartnernummer (GPA)
   * provisioniert — dieser Claim referenziert damit wirtschaftlich die
   * GPA, auch wenn der ZITADEL-seitige Claim-Name selbst unverändert
   * "Organization" heißt (ADR 0008, Entscheidung Punkt 1).
   */
  org_id?: string;
  /**
   * PLATZHALTER: alternative, ZITADEL-eigene URN-Claim-Form für die
   * "Resource Owner"-Organisation eines Nutzers — trägt laut ADR 0008
   * ebenfalls fachlich die GPA (siehe `org_id`).
   */
  'urn:zitadel:iam:user:resourceowner:id'?: string;
  /**
   * PLATZHALTER (ADR 0008, Entscheidung Punkt 2 / "Offene Annahmen"):
   * möglicher Custom-Claim-/Metadaten-Name für den Nutzertyp (Lieferant,
   * Gastbenutzer, Spedition, Steuerberater) der jeweiligen Anmeldung
   * innerhalb der GPA-Organization. Der exakte Claim-Name ist laut
   * ADR 0008 offen — dieser Platzhalter macht nur den Extraktionsfluss
   * sichtbar.
   */
  user_type?: string;
}

/**
 * Normalisierte Claims NACH erfolgreicher kryptographischer
 * Signaturprüfung durch einen `TokenVerifier` (siehe
 * `token-verifier.interface.ts`), aber VOR der fachlichen Claims-Policy-
 * Prüfung (Ablaufzeit/Issuer/Audience), die laut ADR 0004 bewusst getrennt
 * in `AuthGuardService` erfolgt.
 */
export interface VerifiedTokenClaims {
  subject: string;
  issuer: string;
  audience: string | string[];
  /** Unix-Timestamp (Sekunden). */
  expiresAt: number;
  /** Unix-Timestamp (Sekunden). */
  issuedAt: number;
  email?: string;
  /**
   * Aus einem der in `RawZitadelTokenPayload` genannten
   * Organization-Claims extrahiert. Trägt seit ADR 0008 fachlich die
   * Geschäftspartnernummer (GPA) — `AuthGuardService` bildet daraus
   * `AuthenticatedSupplierContext.supplierId` (= GPA), siehe ADR 0008
   * Entscheidung Punkt 1. `null`, wenn das Token keinen
   * Organization-/GPA-Claim enthält — `AuthGuardService` behandelt das als
   * expliziten Fehlerfall, nicht als stillen Fallback (siehe ADR 0004
   * Punkt 3, "Herkunftsgarantie" für `supplierId`).
   */
  organizationId: string | null;
  /**
   * Nutzertyp der Anmeldung (ADR 0008, Entscheidung Punkt 2), sofern im
   * Token vorhanden und ein bekannter Wert. `null`, wenn kein/kein
   * bekannter `user_type`-Claim vorhanden ist — das ist bewusst KEIN
   * Fehlerfall (anders als ein fehlender GPA-Claim), da `userType` laut
   * ADR 0008 keine Autorisierungswirkung hat.
   */
  userType: SupplierUserType | null;
}
