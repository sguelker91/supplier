/**
 * ÜBERGANGSLÖSUNG -- keine echte Persistenz.
 *
 * ADR 0009 Abschnitt 3 sieht eine eigene `DeliveryAuthorization`-Persistenz
 * in `apps/api` vor, trifft aber bewusst KEINE Datenbank-/ORM-Entscheidung
 * (unverändert offene Lücke aus ADR 0001). Diese In-Memory-Implementierung
 * von `DeliveryAuthorizationRepository` macht das Modul lauffähig/testbar,
 * ist aber ausdrücklich KEINE Persistenzentscheidung.
 *
 * Enthält ausschließlich synthetische, klar erkennbare Platzhalterdaten für
 * zwei unterschiedliche Lieferanten (Mandantentrennungs-Fixtures), keine
 * echten Lieferanten-/Finanzdaten (siehe CLAUDE.md, "Sensible Daten").
 *
 * Die Zeitraum-Filterung nutzt lexikographischen String-Vergleich der
 * ISO-8601-Datumswerte (`YYYY-MM-DD`), was für dieses Format äquivalent zum
 * chronologischen Vergleich ist -- ausreichend für diese Übergangslösung,
 * eine echte DB-Anbindung würde stattdessen eine Datums-/Bereichsabfrage
 * verwenden.
 */

import { Injectable } from '@nestjs/common';

import type { DeliveryAuthorizationRepository } from './delivery-authorization-repository.interface';
import type { DeliveryAuthorization } from './delivery-authorization.types';

const SEED_DELIVERY_AUTHORIZATIONS: DeliveryAuthorization[] = [
  {
    id: 'delivery-authorization-synthetic-001',
    supplierId: 'supplier-synthetic-a',
    callOffNumber: 'SYNTH-ABRUF-001',
    deliveryDate: '2026-08-10',
    deliveryTime: '08:00',
    variety: 'Testsorte A',
  },
  {
    id: 'delivery-authorization-synthetic-002',
    supplierId: 'supplier-synthetic-a',
    callOffNumber: 'SYNTH-ABRUF-002',
    deliveryDate: '2026-08-15',
    deliveryTime: '13:30',
    variety: 'Testsorte B',
  },
  {
    id: 'delivery-authorization-synthetic-003',
    supplierId: 'supplier-synthetic-a',
    callOffNumber: 'SYNTH-ABRUF-003',
    deliveryDate: '2026-09-01',
    deliveryTime: '09:15',
    variety: 'Testsorte A',
  },
  {
    id: 'delivery-authorization-synthetic-004',
    supplierId: 'supplier-synthetic-b',
    callOffNumber: 'SYNTH-ABRUF-004',
    deliveryDate: '2026-08-12',
    deliveryTime: '10:00',
    variety: 'Testsorte C',
  },
];

@Injectable()
export class InMemoryDeliveryAuthorizationRepository implements DeliveryAuthorizationRepository {
  private readonly deliveryAuthorizations: DeliveryAuthorization[] = SEED_DELIVERY_AUTHORIZATIONS.map(
    (item) => ({ ...item }),
  );

  async findManyForSupplier(
    supplierId: string,
    range: { from: string; to: string },
  ): Promise<DeliveryAuthorization[]> {
    return this.deliveryAuthorizations.filter(
      (item) =>
        item.supplierId === supplierId &&
        item.deliveryDate >= range.from &&
        item.deliveryDate <= range.to,
    );
  }

  async findById(id: string): Promise<DeliveryAuthorization | null> {
    return this.deliveryAuthorizations.find((item) => item.id === id) ?? null;
  }
}
