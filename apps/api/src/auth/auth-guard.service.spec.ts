/**
 * Unit-Tests für `AuthGuardService` gegen ein `FakeTokenVerifier`-Test-Double
 * (ADR 0006 Punkt 3: niemals gegen die echte ZITADEL-Cloud-Instanz testen).
 * Deckt genau den in der Aufgabenstellung benannten zentralen
 * QA/Security-Blocker ab: der Guard lehnt fehlendes/ungültiges Token ab.
 */

import { AuthenticationError, AuthGuardService } from './auth-guard.service';
import { FakeTokenVerifier } from './testing/fake-token-verifier';

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

  it('lehnt ein ansonsten gültiges Token ohne Organization-Claim ab (missing_organization_claim)', async () => {
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

  it('baut aus einem gültigen Token den AuthenticatedSupplierContext auf', async () => {
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
});
