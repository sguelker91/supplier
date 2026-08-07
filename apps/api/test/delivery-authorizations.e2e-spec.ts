/**
 * HTTP-Layer-Integrationstest gegen den echten `apps/api`-Server
 * (Test.createTestingModule + supertest), analog `contracts.e2e-spec.ts`,
 * für den neuen `delivery-authorizations`-Endpunkt (ADR 0009 Abschnitt 3):
 * "Lieferant A ruft Lieferberechtigung von Lieferant B ab -> 403" sowie
 * die 400-Validierung von `from`/`to`.
 *
 * Läuft gemäß ADR 0006 Punkt 3 NIEMALS gegen die echte ZITADEL-Cloud-
 * Instanz: `TOKEN_VERIFIER` wird per `overrideProvider` durch
 * `FakeTokenVerifier` ersetzt.
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

describe('Delivery-Authorizations HTTP-Layer — Mandantentrennungs-Gate (ADR 0002/0009)', () => {
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

  it('GET /delivery-authorizations ohne Token -> 401', async () => {
    await request(app.getHttpServer())
      .get('/delivery-authorizations?from=2026-08-01&to=2026-08-31')
      .expect(401);
  });

  it('GET /delivery-authorizations ohne "from"/"to" -> 400', async () => {
    const token = await tokenFor('supplier-synthetic-a');

    await request(app.getHttpServer())
      .get('/delivery-authorizations')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('GET /delivery-authorizations mit ungültigem Datum -> 400', async () => {
    const token = await tokenFor('supplier-synthetic-a');

    await request(app.getHttpServer())
      .get('/delivery-authorizations?from=nicht-valide&to=2026-08-31')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('GET /delivery-authorizations mit gültigem Token und Zeitraum -> 200 und nur eigene Lieferberechtigungen', async () => {
    const token = await tokenFor('supplier-synthetic-a');

    const response = await request(app.getHttpServer())
      .get('/delivery-authorizations?from=2026-08-01&to=2026-08-31')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThan(0);
    for (const item of response.body.items) {
      expect(item.supplierId).toBe('supplier-synthetic-a');
    }
  });

  it('GET /delivery-authorizations/:id für die eigene Lieferberechtigung -> 200', async () => {
    const token = await tokenFor('supplier-synthetic-a');

    await request(app.getHttpServer())
      .get('/delivery-authorizations/delivery-authorization-synthetic-001')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('GET /delivery-authorizations/:id für die Lieferberechtigung eines ANDEREN Lieferanten -> 403 (Kern-Gate)', async () => {
    // Lieferant A ruft eine Lieferberechtigung ab, die Lieferant B gehört.
    const tokenOfSupplierA = await tokenFor('supplier-synthetic-a');

    const response = await request(app.getHttpServer())
      .get('/delivery-authorizations/delivery-authorization-synthetic-004')
      .set('Authorization', `Bearer ${tokenOfSupplierA}`)
      .expect(403);

    // Daten dürfen im 403-Fall in keinem Fall ausgeliefert werden.
    expect(response.body).not.toHaveProperty('callOffNumber');
  });

  it('GET /delivery-authorizations/:id für eine unbekannte ID -> 404', async () => {
    const token = await tokenFor('supplier-synthetic-a');

    await request(app.getHttpServer())
      .get('/delivery-authorizations/unbekannte-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
