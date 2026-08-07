/**
 * Fachliche Logik, die laut ADR 0002 (unverändert übernommen für die neue
 * Domäne, ADR 0009 Abschnitt 3) für die lieferantenscoped
 * Lieferberechtigungs-Endpunkte serverseitig durchgesetzt werden muss:
 * `supplierId` kommt ausschließlich aus dem verifizierten Auth-Kontext
 * (nie aus Pfad-/Query-/Body-Parametern), und der 403-vs-404-Unterschied
 * bei Detailzugriff (ADR 0002 Punkt 4).
 *
 * `getMyDeliveryAuthorizationById` wird NICHT nur von
 * `DeliveryAuthorizationsController` genutzt, sondern zusätzlich von
 * `DocumentsController` (ADR 0009 Abschnitt 8) für die dort geforderte
 * zweite Ownership-Prüfung an der `/documents`-Grenze.
 */

import { Inject, Injectable } from '@nestjs/common';

import type { AuthenticatedSupplierContext } from '../contracts/contract.types';
import { DELIVERY_AUTHORIZATION_REPOSITORY } from './delivery-authorization-repository.token';
import type { DeliveryAuthorizationRepository } from './delivery-authorization-repository.interface';
import type { DeliveryAuthorization } from './delivery-authorization.types';

export type DeliveryAuthorizationDetailResult =
  | { kind: 'ok'; deliveryAuthorization: DeliveryAuthorization }
  | { kind: 'not_found' }
  | { kind: 'forbidden' };

@Injectable()
export class DeliveryAuthorizationsService {
  constructor(
    @Inject(DELIVERY_AUTHORIZATION_REPOSITORY)
    private readonly deliveryAuthorizations: DeliveryAuthorizationRepository,
  ) {}

  /**
   * AC1/AC4/AC5/AC14: Liste "meiner" Lieferberechtigungen im angegebenen
   * Zeitraum. `supplierId` stammt ausschließlich aus dem verifizierten
   * Auth-Kontext; ein leeres Array ist ein gültiges Ergebnis (AC16 -
   * Leer-Zustand wird von apps/web dargestellt, nicht als Fehler).
   */
  async listMyDeliveryAuthorizations(
    auth: AuthenticatedSupplierContext,
    range: { from: string; to: string },
  ): Promise<DeliveryAuthorization[]> {
    return this.deliveryAuthorizations.findManyForSupplier(auth.supplierId, range);
  }

  /**
   * AC10/AC11/AC14: Detailzugriff "meiner" Lieferberechtigung, mit dem in
   * ADR 0002 Punkt 4 festgelegten Statuscode-Verhalten:
   * - Lieferberechtigung existiert nicht            -> 'not_found' (404)
   * - Lieferberechtigung existiert, fremder Besitzer -> 'forbidden' (403)
   * - Lieferberechtigung existiert und gehört mir    -> 'ok'
   *
   * Daten werden im 'forbidden'-Fall NICHT zurückgegeben.
   */
  async getMyDeliveryAuthorizationById(
    id: string,
    auth: AuthenticatedSupplierContext,
  ): Promise<DeliveryAuthorizationDetailResult> {
    const deliveryAuthorization = await this.deliveryAuthorizations.findById(id);

    if (!deliveryAuthorization) {
      return { kind: 'not_found' };
    }

    if (deliveryAuthorization.supplierId !== auth.supplierId) {
      return { kind: 'forbidden' };
    }

    return { kind: 'ok', deliveryAuthorization };
  }
}
