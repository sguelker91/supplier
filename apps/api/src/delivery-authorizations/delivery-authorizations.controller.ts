/**
 * Echter NestJS-Controller für `GET /delivery-authorizations` und
 * `GET /delivery-authorizations/:id` (ADR 0009 Abschnitt 3). Setzt exakt
 * das in ADR 0002 Punkt 4 festgelegte Statuscode-Mapping um (unverändert
 * übernommen von `contracts.controller.ts`):
 * - kein gültiges/authentifiziertes Token -> 401 (via `ZitadelAuthGuard`)
 * - `from`/`to` fehlen oder ungültig         -> 400
 * - Lieferberechtigung existiert nicht        -> 404
 * - Lieferberechtigung existiert, fremder Lieferant -> 403
 * - Lieferberechtigung existiert und gehört mir      -> 200
 *
 * Die Autorisierungslogik selbst lebt unverändert in
 * `DeliveryAuthorizationsService` -- dieser Controller ist bewusst dünn.
 */

import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthContext } from '../auth/auth-context.decorator';
import { ZitadelAuthGuard } from '../auth/zitadel-auth.guard';
import type { AuthenticatedSupplierContext } from '../contracts/contract.types';
import { parseDeliveryAuthorizationDateRangeOrThrow } from './date-range.util';
import type {
  DeliveryAuthorizationDetailResponse,
  DeliveryAuthorizationListResponse,
} from './delivery-authorization.types';
import { DeliveryAuthorizationsService } from './delivery-authorizations.service';

/**
 * TODO (Konturwurf, analog `ContractsService`): ADR 0009 nennt
 * `DeliveryAuthorizationSyncRun` nur strukturell ("identisch zu
 * ContractSyncRun"), skizziert ihn aber nicht -- echte Sync-Metadaten
 * (letzter erfolgreicher Lauf, Stale-Erkennung) sind daher noch nicht
 * ermittelt. Platzhalterwert, bis eine Sync-Historie existiert; ob
 * `apps/web` diesen Hinweis für Lieferberechtigungen überhaupt anzeigt,
 * ist laut Backlog ausdrücklich offen.
 */
const PLACEHOLDER_SYNC_META = { lastSuccessfulSyncAt: null, isStale: false } as const;

@Controller('delivery-authorizations')
@UseGuards(ZitadelAuthGuard)
export class DeliveryAuthorizationsController {
  constructor(private readonly deliveryAuthorizations: DeliveryAuthorizationsService) {}

  /** `GET /delivery-authorizations?from=&to=` (AC1/AC4/AC5/AC14). */
  @Get()
  async listMyDeliveryAuthorizations(
    @Query('from') from: unknown,
    @Query('to') to: unknown,
    @AuthContext() auth: AuthenticatedSupplierContext,
  ): Promise<DeliveryAuthorizationListResponse> {
    const range = parseDeliveryAuthorizationDateRangeOrThrow(from, to);
    const items = await this.deliveryAuthorizations.listMyDeliveryAuthorizations(auth, range);
    return { items, ...PLACEHOLDER_SYNC_META };
  }

  /**
   * `GET /delivery-authorizations/:id` (AC10/AC11/AC14). Statuscode-Mapping
   * folgt exakt ADR 0002 Punkt 4 -- Daten werden im 403-Fall in keinem Fall
   * ausgeliefert.
   */
  @Get(':id')
  async getMyDeliveryAuthorizationById(
    @Param('id') id: string,
    @AuthContext() auth: AuthenticatedSupplierContext,
  ): Promise<DeliveryAuthorizationDetailResponse> {
    const result = await this.deliveryAuthorizations.getMyDeliveryAuthorizationById(id, auth);

    switch (result.kind) {
      case 'ok':
        return { ...result.deliveryAuthorization, ...PLACEHOLDER_SYNC_META };
      case 'not_found':
        throw new NotFoundException();
      case 'forbidden':
        throw new ForbiddenException();
    }
  }
}
