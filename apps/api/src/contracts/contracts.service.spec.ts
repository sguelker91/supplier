/**
 * Unit-Test für die Mandantentrennungs-Kernlogik aus ADR 0002 Punkt 4:
 * 403 (fremder Lieferant) vs. 404 (Kontrakt existiert nicht) vs. 200
 * (eigener Kontrakt). Nutzt ausschließlich synthetische Testdaten
 * (CLAUDE.md, "Sensible Daten").
 */

import type { Contract } from './contract.types';
import type { ContractRepository } from './contract-repository.interface';
import { ContractsService } from './contracts.service';

const SUPPLIER_A = 'supplier-synthetic-a';
const SUPPLIER_B = 'supplier-synthetic-b';

const CONTRACT_OF_A: Contract = {
  id: 'contract-synthetic-a-1',
  supplierId: SUPPLIER_A,
  contractNumber: 'SYNTH-TEST-A-1',
  articleOrProductGroup: 'Testartikelgruppe',
  agreedQuantity: { value: 10, unit: 'Stk' },
  validFrom: '2026-01-01',
  validTo: '2026-12-31',
  status: 'active',
  conditions: [],
};

const CONTRACT_OF_B: Contract = {
  id: 'contract-synthetic-b-1',
  supplierId: SUPPLIER_B,
  contractNumber: 'SYNTH-TEST-B-1',
  articleOrProductGroup: 'Testartikelgruppe',
  agreedQuantity: { value: 5, unit: 'Stk' },
  validFrom: '2026-01-01',
  validTo: '2026-12-31',
  status: 'active',
  conditions: [],
};

class InMemoryTestRepository implements ContractRepository {
  constructor(private readonly contracts: Contract[]) {}

  async findManyForSupplier(supplierId: string): Promise<Contract[]> {
    return this.contracts.filter((c) => c.supplierId === supplierId);
  }

  async findById(contractId: string): Promise<Contract | null> {
    return this.contracts.find((c) => c.id === contractId) ?? null;
  }
}

describe('ContractsService — Mandantentrennung (ADR 0002)', () => {
  const repository = new InMemoryTestRepository([CONTRACT_OF_A, CONTRACT_OF_B]);
  const service = new ContractsService(repository);

  it('listMyContracts liefert ausschließlich Kontrakte des angefragten Lieferanten', async () => {
    const result = await service.listMyContracts({ supplierId: SUPPLIER_A });
    expect(result).toEqual([CONTRACT_OF_A]);
  });

  it('listMyContracts liefert ein leeres Array, wenn der Lieferant keine Kontrakte hat (AC5)', async () => {
    const result = await service.listMyContracts({ supplierId: 'supplier-synthetic-c' });
    expect(result).toEqual([]);
  });

  it('getMyContractById liefert "ok" für den eigenen Kontrakt', async () => {
    const result = await service.getMyContractById(CONTRACT_OF_A.id, { supplierId: SUPPLIER_A });
    expect(result).toEqual({ kind: 'ok', contract: CONTRACT_OF_A });
  });

  it('getMyContractById liefert "forbidden" (403) für einen fremden Kontrakt, niemals die Daten', async () => {
    const result = await service.getMyContractById(CONTRACT_OF_B.id, { supplierId: SUPPLIER_A });
    expect(result).toEqual({ kind: 'forbidden' });
  });

  it('getMyContractById liefert "not_found" (404) für eine unbekannte ID', async () => {
    const result = await service.getMyContractById('unknown-id', { supplierId: SUPPLIER_A });
    expect(result).toEqual({ kind: 'not_found' });
  });
});
