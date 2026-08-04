/**
 * Unit-Tests für `AuthGuardService` gegen ein `FakeTokenVerifier`-Test-Double
 * (ADR 0006 Punkt 3: niemals gegen die echte ZITADEL-Cloud-Instanz testen).
 * Deckt den in der Aufgabenstellung benannten zentralen QA/Security-Blocker
 * ab (der Guard lehnt fehlendes/ungültiges Token ab) sowie die durch
 * ADR 0008 hinzugekommenen Erweiterungen: GPA-Claim-Extraktion
 * (`supplierId === GPA`) und `userType`-Claim-Extraktion ohne
 * Autorisierungswirkung.
 */

import { AuthenticationError, AuthGuardService } from './auth-guard.service';
import { FakeTokenVerifier } from './testing/fake-token-verifier';
import { SupplierUserType } from './user-type';

const EXPECTED_ISSUER = 'https://synthetic-test-issuer.example';
const EXPECTED_AUDIENCE = 'synthetic-test-audience';

function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

describe('AuthGuardService (ADR 0002/ADR 0004)', () => {
  let fakeVerifier: FakeTokenVerifier;
  let guard: AuthGuardService;

  beforeEach(async () => {
    fakeVerifier = await FakeTokenVerifier.create();
    guard = new AuthGuardService(fakeVerifier, {
      expectedIssuer: EXPECTED_ISSUER,
      expectedAudience: EXPECTED_AUDIENCE,
    });
  });

  it('lehnt einen Request ohne Authorization-Header ab (missing_token)', async () => {
    await expect(guard.authenticate(undefined)).rejects.toMatchObject({
      reason: 'missing_token',
    });
  });

  it('lehnt einen Authorization-Header ohne Bearer-Präfix ab', async () => {
    await expect(guard.authenticate('Basic irgendwas')).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it('lehnt ein strukturell ungültiges Token ab (invalid_or_expired_token)', async () => {
    await expect(guard.authenticate('Bearer nicht.valide.jwt')).rejects.toMatchObject({
      reason: 'invalid_or_expired_token',
    });
  });

  it('lehnt ein abgelaufenes Token ab', async () => {
    const token = await fakeVerifier.issueTestToken({
      sub: 'synthetic-user-1',
      iss: EXPECTED_ISSUER,
      aud: EXPECTED_AUDIENCE,
      exp: nowInSeconds() - 60,
      org_id: 'supplier-synthetic-a',
    });

    await expect(guard.authenticate(`Bearer ${token}`)).rejects.toMatchObject({
      reason: 'invalid_or_expired_token',
    });
  });

  it('lehnt ein Token mit falschem Issuer ab (issuer_mismatch)', async () => {
    const token = await fakeVerifier.issueTestToken({
      sub: 'synthetic-user-1',
      iss: 'https://ein-anderer-issuer.example',
      aud: EXPECTED_AUDIENCE,
      exp: nowInSeconds() + 3600,
      org_id: 'supplier-synthetic-a',
    });

    await expect(guard.authenticate(`Bearer ${token}`)).rejects.toMatchObject({
      reason: 'issuer_mismatch',
    });
  });

  it('lehnt ein Token mit falscher Audience ab (audience_mismatch)', async () => {
    const token = await fakeVerifier.issueTestToken({
      sub: 'synthetic-user-1',
      iss: EXPECTED_ISSUER,
      aud: 'eine-andere-audience',
      exp: nowInSeconds() + 3600,
      org_id: 'supplier-synthetic-a',
    });

    await expect(guard.authenticate(`Bearer ${token}`)).rejects.toMatchObject({
      reason: 'audience_mismatch',
    });
  });

  it('lehnt ein ansonsten gültiges Token ohne GPA-tragenden Organization-Claim ab (missing_organization_claim, ADR 0008)', async () => {
    const token = await fakeVerifier.issueTestToken({
      sub: 'synthetic-user-1',
      iss: EXPECTED_ISSUER,
      aud: EXPECTED_AUDIENCE,
      exp: nowInSeconds() + 3600,
    });

    await expect(guard.authenticate(`Bearer ${token}`)).rejects.toMatchObject({
      reason: 'missing_organization_claim',
    });
  });

  it('baut aus einem gültigen Token den AuthenticatedSupplierContext mit supplierId === GPA auf (ADR 0008)', async () => {
    const token = await fakeVerifier.issueTestToken({
      sub: 'synthetic-user-1',
      iss: EXPECTED_ISSUER,
      aud: EXPECTED_AUDIENCE,
      exp: nowInSeconds() + 3600,
      org_id: 'supplier-synthetic-a',
    });

    await expect(guard.authenticate(`Bearer ${token}`)).resolves.toEqual({
      supplierId: 'supplier-synthetic-a',
    });
  });

  it('extrahiert den userType-Claim zusätzlich zur GPA in den AuthenticatedSupplierContext (ADR 0008)', async () => {
    const token = await fakeVerifier.issueTestToken({
      sub: 'synthetic-user-1',
      iss: EXPECTED_ISSUER,
      aud: EXPECTED_AUDIENCE,
      exp: nowInSeconds() + 3600,
      org_id: 'supplier-synthetic-a',
      user_type: SupplierUserType.TAX_ADVISOR,
    });

    await expect(guard.authenticate(`Bearer ${token}`)).resolves.toEqual({
      supplierId: 'supplier-synthetic-a',
      userType: SupplierUserType.TAX_ADVISOR,
    });
  });

  it('liefert userType als undefined, wenn das Token keinen (bekannten) Nutzertyp-Claim enthält -- kein Fehlerfall (ADR 0008)', async () => {
    const token = await fakeVerifier.issueTestToken({
      sub: 'synthetic-user-1',
      iss: EXPECTED_ISSUER,
      aud: EXPECTED_AUDIENCE,
      exp: nowInSeconds() + 3600,
      org_id: 'supplier-synthetic-a',
      user_type: 'unbekannter-wert',
    });

    const result = await guard.authenticate(`Bearer ${token}`);
    expect(result.supplierId).toBe('supplier-synthetic-a');
    expect(result.userType).toBeUndefined();
  });

  it('zwei unterschiedliche Anmeldungen (userType) derselben GPA erhalten identische supplierId, keine Vermischung (AC4)', async () => {
    const tokenAsSupplier = await fakeVerifier.issueTestToken({
      sub: 'synthetic-user-supplier',
      iss: EXPECTED_ISSUER,
      aud: EXPECTED_AUDIENCE,
      exp: nowInSeconds() + 3600,
      org_id: 'supplier-synthetic-a',
      user_type: SupplierUserType.SUPPLIER,
    });
    const tokenAsFreightForwarder = await fakeVerifier.issueTestToken({
      sub: 'synthetic-user-freight-forwarder',
      iss: EXPECTED_ISSUER,
      aud: EXPECTED_AUDIENCE,
      exp: nowInSeconds() + 3600,
      org_id: 'supplier-synthetic-a',
      user_type: SupplierUserType.FREIGHT_FORWARDER,
    });

    const contextAsSupplier = await guard.authenticate(`Bearer ${tokenAsSupplier}`);
    const contextAsFreightForwarder = await guard.authenticate(`Bearer ${tokenAsFreightForwarder}`);

    expect(contextAsSupplier.supplierId).toBe('supplier-synthetic-a');
    expect(contextAsFreightForwarder.supplierId).toBe('supplier-synthetic-a');
    expect(contextAsSupplier.userType).toBe(SupplierUserType.SUPPLIER);
    expect(contextAsFreightForwarder.userType).toBe(SupplierUserType.FREIGHT_FORWARDER);
  });
});
