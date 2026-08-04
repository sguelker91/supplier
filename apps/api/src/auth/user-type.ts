/**
 * Nutzertyp-Attribut aus
 * [ADR 0008](../../../../docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md)
 * ("GPA als Mandanten-Schlüssel, Mehrfachanmeldungen pro GPA und Okta als
 * föderierter MFA-Provider"), Entscheidung Punkt 2.
 *
 * Auf eine GPA (= ein Lieferant/Mandant) können laut ADR 0008 mehrere
 * unterschiedliche Anmeldungen existieren (Lieferant selbst, Gastbenutzer,
 * Spedition, Steuerberater). `SupplierUserType` macht diesen Unterschied im
 * verifizierten Auth-Kontext (`AuthenticatedSupplierContext`) sichtbar.
 *
 * WICHTIG (ADR 0008, "Ausdrücklich außerhalb dieses Scopes"): `userType`
 * hat KEINE Autorisierungs-/Sichtbarkeitswirkung. Es wird von KEINER
 * Guard- oder Repository-Filter-Logik ausgewertet — die Mandantentrennung
 * (ADR 0002) erfolgt weiterhin ausschließlich über `supplierId` (GPA).
 * `userType` wird nur transportiert, damit eine künftige, separate
 * Berechtigungs-ADR/-Story (siehe Nicht-Ziele der Backlog-Story
 * `lieferanten-anmeldung-gpa`) die Claims-/Token-Verarbeitungsschicht nicht
 * erneut anfassen muss.
 *
 * Die exakten Enum-Bezeichner sind laut ADR 0008 ausdrücklich ein
 * Umsetzungsdetail des Developer-Agenten — ebenso der exakte
 * ZITADEL-Claim-/Metadaten-Mechanismus, über den `userType` im Token
 * ankommt (Custom Role, Custom-Metadata-Attribut, Claim-Mapping via
 * Actions), der laut ADR 0008 "nicht final spezifiziert" ist.
 */
export enum SupplierUserType {
  /** Der Lieferant selbst. */
  SUPPLIER = 'SUPPLIER',
  /** Gastbenutzer, dem eine GPA Zugriff eingeräumt hat. */
  GUEST = 'GUEST',
  /** Von der GPA beauftragte Spedition. */
  FREIGHT_FORWARDER = 'FREIGHT_FORWARDER',
  /** Von der GPA beauftragter Steuerberater. */
  TAX_ADVISOR = 'TAX_ADVISOR',
}

/**
 * Ordnet einen rohen, unverifizierten `user_type`-Claim-Wert einem
 * bekannten `SupplierUserType` zu. Liefert `null`, wenn der Claim fehlt
 * oder einen unbekannten Wert enthält — das ist bewusst KEIN Fehlerfall
 * (anders als ein fehlender GPA-Claim), da `userType` laut ADR 0008 keine
 * Autorisierungswirkung hat und daher ohne fachliches Risiko toleriert
 * werden kann, statt die gesamte Authentifizierung fehlschlagen zu lassen.
 */
export function parseSupplierUserType(rawValue: unknown): SupplierUserType | null {
  if (typeof rawValue !== 'string') {
    return null;
  }
  return (Object.values(SupplierUserType) as string[]).includes(rawValue)
    ? (rawValue as SupplierUserType)
    : null;
}
