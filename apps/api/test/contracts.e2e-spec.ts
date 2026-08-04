/**
 * HTTP-Layer-Integrationstest gegen den echten `apps/api`-Server
 * (Test.createTestingModule + supertest), wie in ADR 0005 Punkt 4 und
 * ADR 0006 Punkt 2 als Merge-Gate für die Mandantentrennung gefordert:
 * "Lieferant A ruft Kontrakt von Lieferant B ab -> 403".
 *
 * Läuft gemäß ADR 0006 Punkt 3 NIEMALS gegen die echte ZITADEL-Cloud-
 * Instanz: `TOKEN_VERIFIER` wird per `overrideProvider` durch
 * `FakeTokenVerifier` ersetzt (selbst-signierte Test-Tokens, kein
 * Netzwerkzugriff, kein Bezug zu einer echten ZITADEL-Instanz).
 */

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { AUTH_GUARD_CONFIG } from '../src/auth/auth-guard-config.token';
import { FakeTokenVerifier } from '../src/auth/testing/fake-token-verifier';
import { TOKEN_VERIFIER } from '../src/auth/token-verifier.token';

const TEST_ISSUER = 'https://synthetic-test-issuer.example';
const TEST_AUDIENCE = 'synthetic-test-api-audience';

function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

describe('Contracts HTTP-Layer — Mandantentrennungs-Gate (ADR 0002/0005/0006)', () => {
  let app: INestApplication;
  let fakeTokenVerifier: FakeTokenVerifier;

  beforeAll(async () => {
    fakeTokenVerifier = await FakeTokenVerifier.create();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TOKEN_VERIFIER)
      .useValue(fakeTokenVerifier)
      .overrideProvider(AUTH_GUARD_CONFIG)
      .useValue({ expectedIssuer: TEST_ISSUER, expectedAudience: TEST_AUDIENCE })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function tokenFor(organizationId: string): Promise<string> {
    return fakeTokenVerifier.issueTestToken({
      sub: `synthetic-user-of-${organizationId}`,
      iss: TEST_ISSUER,
      aud: TEST_AUDIENCE,
      exp: nowInSeconds() + 3600,
      org_id: organizationId,
    });
  }

  it('GET /contracts ohne Token -> 401', async () => {
    await request(app.getHttpServer()).get('/contracts').expect(401);
  });

  it('GET /contracts mit gültigem Token -> 200 und nur eigene Kontrakte', async () => {
    const token = await tokenFor('supplier-synthetic-a');

    const response = await request(app.getHttpServer())
      .get('/contracts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    for (const contract of response.body) {
      expect(contract.supplierId).toBe('supplier-synthetic-a');
    }
  });

  it('GET /contracts/:contractId für den eigenen Kontrakt -> 200', async () => {
    const token = await tokenFor('supplier-synthetic-a');

    await request(app.getHttpServer())
      .get('/contracts/contract-synthetic-001')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('GET /contracts/:contractId für den Kontrakt eines ANDEREN Lieferanten -> 403 (Kern-Gate)', async () => {
    // Lieferant A ruft einen Kontrakt ab, der Lieferant B gehört.
    const tokenOfSupplierA = await tokenFor('supplier-synthetic-a');

    const response = await request(app.getHttpServer())
      .get('/contracts/contract-synthetic-003')
      .set('Authorization', `Bearer ${tokenOfSupplierA}`)
      .expect(403);

    // Kontraktdaten dürfen im 403-Fall in keinem Fall ausgeliefert werden.
    expect(response.body).not.toHaveProperty('contractNumber');
  });

  it('GET /contracts/:contractId für eine unbekannte ID -> 404', async () => {
    const token = await tokenFor('supplier-synthetic-a');

    await request(app.getHttpServer())
      .get('/contracts/unbekannte-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('GET /contracts/:contractId mit ungültigem Token -> 401, keine Daten', async () => {
    const response = await request(app.getHttpServer())
      .get('/contracts/contract-synthetic-001')
      .set('Authorization', 'Bearer ungueltiges.token.hier')
      .expect(401);

    expect(response.body).not.toHaveProperty('contractNumber');
  });
});
