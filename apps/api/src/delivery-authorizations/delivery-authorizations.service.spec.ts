/**
 * Unit-Test für die Mandantentrennungs-Kernlogik aus ADR 0002 Punkt 4
 * (übernommen für Lieferberechtigungen, ADR 0009 Abschnitt 3): 403
 * (fremder Lieferant) vs. 404 (existiert nicht) vs. 200 (eigene
 * Lieferberechtigung), sowie die Zeitraum-Filterung. Nutzt ausschließlich
 * synthetische Testdaten (CLAUDE.md, "Sensible Daten").
 */

import type { DeliveryAuthorizationRepository } from './delivery-authorization-repository.interface';
import type { DeliveryAuthorization } from './delivery-authorization.types';
import { DeliveryAuthorizationsService } from './delivery-authorizations.service';

const SUPPLIER_A = 'supplier-synthetic-a';
const SUPPLIER_B = 'supplier-synthetic-b';

const DELIVERY_AUTHORIZATION_OF_A_IN_RANGE: DeliveryAuthorization = {
  id: 'delivery-authorization-synthetic-a-1',
  supplierId: SUPPLIER_A,
  callOffNumber: 'SYNTH-TEST-A-1',
  deliveryDate: '2026-08-10',
  deliveryTime: '08:00',
  variety: 'Testsorte',
};

const DELIVERY_AUTHORIZATION_OF_A_OUT_OF_RANGE: DeliveryAuthorization = {
  id: 'delivery-authorization-synthetic-a-2',
  supplierId: SUPPLIER_A,
  callOffNumber: 'SYNTH-TEST-A-2',
  deliveryDate: '2026-09-20',
  deliveryTime: '09:00',
  variety: 'Testsorte',
};

const DELIVERY_AUTHORIZATION_OF_B: DeliveryAuthorization = {
  id: 'delivery-authorization-synthetic-b-1',
  supplierId: SUPPLIER_B,
  callOffNumber: 'SYNTH-TEST-B-1',
  deliveryDate: '2026-08-10',
  deliveryTime: '10:00',
  variety: 'Testsorte',
};

class InMemoryTestRepository implements DeliveryAuthorizationRepository {
  constructor(private readonly items: DeliveryAuthorization[]) {}

  async findManyForSupplier(
    supplierId: string,
    range: { from: string; to: string },
  ): Promise<DeliveryAuthorization[]> {
    return this.items.filter(
      (item) =>
        item.supplierId === supplierId &&
        item.deliveryDate >= range.from &&
        item.deliveryDate <= range.to,
    );
  }

  async findById(id: string): Promise<DeliveryAuthorization | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }
}

describe('DeliveryAuthorizationsService — Mandantentrennung & Zeitraum-Filterung (ADR 0002/0009)', () => {
  const repository = new InMemoryTestRepository([
    DELIVERY_AUTHORIZATION_OF_A_IN_RANGE,
    DELIVERY_AUTHORIZATION_OF_A_OUT_OF_RANGE,
    DELIVERY_AUTHORIZATION_OF_B,
  ]);
  const service = new DeliveryAuthorizationsService(repository);

  it('listMyDeliveryAuthorizations liefert ausschließlich Lieferberechtigungen des angefragten Lieferanten im Zeitraum', async () => {
    const result = await service.listMyDeliveryAuthorizations(
      { supplierId: SUPPLIER_A },
      { from: '2026-08-01', to: '2026-08-31' },
    );
    expect(result).toEqual([DELIVERY_AUTHORIZATION_OF_A_IN_RANGE]);
  });

  it('listMyDeliveryAuthorizations liefert ein leeres Array außerhalb des Zeitraums (AC16)', async () => {
    const result = await service.listMyDeliveryAuthorizations(
      { supplierId: SUPPLIER_A },
      { from: '2027-01-01', to: '2027-01-31' },
    );
    expect(result).toEqual([]);
  });

  it('listMyDeliveryAuthorizations vermischt niemals Lieferberechtigungen unterschiedlicher Lieferanten', async () => {
    const result = await service.listMyDeliveryAuthorizations(
      { supplierId: SUPPLIER_B },
      { from: '2026-08-01', to: '2026-08-31' },
    );
    expect(result).toEqual([DELIVERY_AUTHORIZATION_OF_B]);
  });

  it('getMyDeliveryAuthorizationById liefert "ok" für die eigene Lieferberechtigung', async () => {
    const result = await service.getMyDeliveryAuthorizationById(
      DELIVERY_AUTHORIZATION_OF_A_IN_RANGE.id,
      { supplierId: SUPPLIER_A },
    );
    expect(result).toEqual({ kind: 'ok', deliveryAuthorization: DELIVERY_AUTHORIZATION_OF_A_IN_RANGE });
  });

  it('getMyDeliveryAuthorizationById liefert "forbidden" (403) für eine fremde Lieferberechtigung, niemals die Daten', async () => {
    const result = await service.getMyDeliveryAuthorizationById(DELIVERY_AUTHORIZATION_OF_B.id, {
      supplierId: SUPPLIER_A,
    });
    expect(result).toEqual({ kind: 'forbidden' });
  });

  it('getMyDeliveryAuthorizationById liefert "not_found" (404) für eine unbekannte ID', async () => {
    const result = await service.getMyDeliveryAuthorizationById('unknown-id', {
      supplierId: SUPPLIER_A,
    });
    expect(result).toEqual({ kind: 'not_found' });
  });
});
