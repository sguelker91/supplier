/**
 * HTTP-Layer-Integrationstest für `GET /documents` (ADR 0009 Abschnitt 8).
 *
 * Deckt gezielt die in ADR 0009 beschriebene Mandantentrennungs-LÜCKE ab:
 * `StubDocumentProvider` liefert für JEDE `subjectId` unterschiedslos eine
 * leere Liste (200 `[]`) -- ohne die zusätzliche Ownership-Prüfung gegen
 * `DeliveryAuthorizationsService` würde ein Lieferant über direkte
 * `subjectId`-Manipulation erfolgreich (nur zufällig leer) auf fremde
 * `subjectId`-Werte zugreifen können, statt eines 403. Dieser Test stellt
 * sicher, dass tatsächlich 403 (nicht 200 `[]`) zurückkommt.
 *
 * Läuft gemäß ADR 0006 Punkt 3 NIEMALS gegen die echte ZITADEL-Cloud-
 * Instanz.
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

describe('Documents HTTP-Layer — zusätzlicher Ownership-Check (ADR 0009 Abschnitt 8)', () => {
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

  it('GET /documents ohne Token -> 401', async () => {
    await request(app.getHttpServer())
      .get('/documents?subjectType=delivery-authorization&subjectId=delivery-authorization-synthetic-001')
      .expect(401);
  });

  it('GET /documents ohne subjectType/subjectId -> 400', async () => {
    const token = await tokenFor('supplier-synthetic-a');

    await request(app.getHttpServer())
      .get('/documents')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('GET /documents mit unbekanntem subjectType -> 400', async () => {
    const token = await tokenFor('supplier-synthetic-a');

    await request(app.getHttpServer())
      .get('/documents?subjectType=unbekannt&subjectId=irgendwas')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('GET /documents für die eigene Lieferberechtigung -> 200 mit (aktuell leerer) Liste des Stub-Providers', async () => {
    const token = await tokenFor('supplier-synthetic-a');

    const response = await request(app.getHttpServer())
      .get('/documents?subjectType=delivery-authorization&subjectId=delivery-authorization-synthetic-001')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('GET /documents für eine unbekannte subjectId -> 404 (nicht die leere Liste des Stub-Providers)', async () => {
    const token = await tokenFor('supplier-synthetic-a');

    await request(app.getHttpServer())
      .get('/documents?subjectType=delivery-authorization&subjectId=unbekannte-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('KERN-GATE: GET /documents für die subjectId eines ANDEREN Lieferanten -> 403, NICHT die leere Liste des Stub-Providers', async () => {
    // Lieferant A versucht, über subjectId-Manipulation Dokument-Metadaten
    // zu einer Lieferberechtigung von Lieferant B zu erfragen.
    const tokenOfSupplierA = await tokenFor('supplier-synthetic-a');

    const response = await request(app.getHttpServer())
      .get('/documents?subjectType=delivery-authorization&subjectId=delivery-authorization-synthetic-004')
      .set('Authorization', `Bearer ${tokenOfSupplierA}`)
      .expect(403);

    // Explizit NICHT "200 []" -- der Stub-Provider selbst würde für jede
    // subjectId unterschiedslos eine leere Liste liefern; die 403-Antwort
    // muss aus der zusätzlichen Ownership-Prüfung stammen, nicht aus dem
    // (zufällig leeren) Provider-Ergebnis.
    expect(response.body).not.toEqual([]);
  });
});
