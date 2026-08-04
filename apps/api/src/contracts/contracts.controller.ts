/**
 * Echter NestJS-Controller für `GET /contracts` und
 * `GET /contracts/:contractId` (ADR 0002 Punkt 2). Setzt exakt das in
 * ADR 0002 Punkt 4 festgelegte Statuscode-Mapping um:
 * - kein gültiges/authentifiziertes Token -> 401 (via `ZitadelAuthGuard`)
 * - Kontrakt existiert nicht                -> 404
 * - Kontrakt existiert, fremder Lieferant   -> 403
 * - Kontrakt existiert und gehört mir       -> 200
 *
 * Die Autorisierungslogik selbst lebt unverändert in `ContractsService`
 * bzw. `AuthGuardService` -- dieser Controller ist bewusst dünn und
 * übersetzt nur zwischen HTTP und der bereits vorhandenen Kernlogik,
 * wie in der bisherigen Konturwurf-Kommentarskizze vorgesehen.
 */

import { Controller, ForbiddenException, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';

import { AuthContext } from '../auth/auth-context.decorator';
import { ZitadelAuthGuard } from '../auth/zitadel-auth.guard';
import type { AuthenticatedSupplierContext, Contract } from './contract.types';
import { ContractsService } from './contracts.service';

@Controller('contracts')
@UseGuards(ZitadelAuthGuard)
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  /** `GET /contracts` (AC1/AC2/AC5, ADR 0002 Punkt 2). */
  @Get()
  async listMyContracts(@AuthContext() auth: AuthenticatedSupplierContext): Promise<Contract[]> {
    return this.contracts.listMyContracts(auth);
  }

  /**
   * `GET /contracts/:contractId` (AC3/AC4). Statuscode-Mapping folgt exakt
   * ADR 0002 Punkt 4 -- Kontraktdaten werden im 403-Fall in keinem Fall
   * ausgeliefert.
   */
  @Get(':contractId')
  async getMyContractById(
    @Param('contractId') contractId: string,
    @AuthContext() auth: AuthenticatedSupplierContext,
  ): Promise<Contract> {
    const result = await this.contracts.getMyContractById(contractId, auth);

    switch (result.kind) {
      case 'ok':
        return result.contract;
      case 'not_found':
        throw new NotFoundException();
      case 'forbidden':
        throw new ForbiddenException();
    }
  }
}
