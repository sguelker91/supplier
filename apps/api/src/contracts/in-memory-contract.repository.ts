/**
 * ÜBERGANGSLÖSUNG -- keine echte Persistenz.
 *
 * ADR 0001 sieht eine eigene `Contract`-Persistenz in `apps/api` vor (Punkt 1),
 * trifft aber bewusst KEINE Datenbank-/ORM-Entscheidung (das ist nicht
 * Gegenstand der referenzierten ADRs und wird hier nicht im Alleingang
 * nachgeholt). Diese In-Memory-Implementierung von `ContractRepository`
 * macht das Modul lauffähig/testbar, ist aber ausdrücklich KEINE
 * Persistenzentscheidung -- sie muss durch eine echte DB-Anbindung ersetzt
 * werden, sobald diese Frage architektonisch entschieden ist.
 *
 * Enthält ausschließlich synthetische, klar erkennbare Platzhalterdaten
 * für zwei unterschiedliche Lieferanten (Mandantentrennungs-Fixtures),
 * keine echten Lieferanten-/Finanzdaten (siehe CLAUDE.md, "Sensible Daten").
 */

import { Injectable } from '@nestjs/common';

import type { Contract } from './contract.types';
import type { ContractRepository } from './contract-repository.interface';

const SEED_CONTRACTS: Contract[] = [
  {
    id: 'contract-synthetic-001',
    supplierId: 'supplier-synthetic-a',
    contractNumber: 'SYNTH-KONTRAKT-001',
    articleOrProductGroup: 'Testartikelgruppe A',
    agreedQuantity: { value: 1000, unit: 'kg' },
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    status: 'active',
    conditions: [{ label: 'Testkondition', value: '1,00', unit: 'EUR/kg' }],
  },
  {
    id: 'contract-synthetic-002',
    supplierId: 'supplier-synthetic-a',
    contractNumber: 'SYNTH-KONTRAKT-002',
    articleOrProductGroup: 'Testartikelgruppe B',
    agreedQuantity: { value: 500, unit: 'Stk' },
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    status: 'expired',
    conditions: [],
  },
  {
    id: 'contract-synthetic-003',
    supplierId: 'supplier-synthetic-b',
    contractNumber: 'SYNTH-KONTRAKT-003',
    articleOrProductGroup: 'Testartikelgruppe C',
    agreedQuantity: { value: 200, unit: 't' },
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    status: 'active',
    conditions: [],
  },
];

@Injectable()
export class InMemoryContractRepository implements ContractRepository {
  private readonly contracts: Contract[] = SEED_CONTRACTS.map((contract) => ({ ...contract }));

  async findManyForSupplier(supplierId: string): Promise<Contract[]> {
    return this.contracts.filter((contract) => contract.supplierId === supplierId);
  }

  async findById(contractId: string): Promise<Contract | null> {
    return this.contracts.find((contract) => contract.id === contractId) ?? null;
  }
}
