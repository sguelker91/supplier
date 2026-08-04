/**
 * PROTOTYP / KONTURWURF — kein lauffähiger Code, kein Framework.
 *
 * Zeigt, wie `ContractsService` (siehe `contracts.service.ts`) laut
 * ADR 0004 Punkt 2 hinter dem `AuthGuardService`
 * (`../auth/auth-guard.service.ts`) hängen würde: Der
 * `AuthenticatedSupplierContext` wird NICHT mehr — wie im bisherigen
 * Prototyp — als reiner Funktionsparameter angenommen, sondern aus einem
 * tatsächlich kryptographisch verifizierten Bearer-Token gewonnen. Das
 * adressiert den kritischen Security-Befund "kein durchsetzender
 * Mechanismus (kein Controller, kein Guard)"
 * (docs/security/lieferant-kontrakte-einsehen.md).
 *
 * Sobald ein Framework entschieden ist (ADR 0003, "Offene technische
 * Entscheidungen"), wird dies zu einem echten NestJS-Controller, etwa:
 *
 *   @Controller('contracts')
 *   @UseGuards(ZitadelAuthGuard)   // kapselt AuthGuardService.authenticate()
 *   export class ContractsController {
 *     constructor(private readonly contracts: ContractsService) {}
 *
 *     @Get()
 *     listMyContracts(@AuthContext() auth: AuthenticatedSupplierContext) {
 *       return this.contracts.listMyContracts(auth);
 *     }
 *
 *     @Get(':contractId')
 *     async getMyContractById(
 *       @Param('contractId') contractId: string,
 *       @AuthContext() auth: AuthenticatedSupplierContext,
 *     ) {
 *       const result = await this.contracts.getMyContractById(contractId, auth);
 *       // Mapping ContractDetailResult -> HTTP-Statuscode (ADR 0002 Punkt 4):
 *       //   'not_found' -> 404, 'forbidden' -> 403, 'ok' -> 200 + Contract
 *     }
 *   }
 *
 * Dieser Konturwurf bildet denselben Ablauf framework-unabhängig als
 * einfache Klasse ab, die einen generischen "eingehenden Request"
 * (nur der `Authorization`-Header ist relevant) entgegennimmt, um die
 * Guard-Integration sichtbar zu machen, ohne NestJS vorauszusetzen.
 *
 * Was hier bewusst fehlt:
 * - Kein echtes Routing/HTTP-Server-Setup.
 * - Kein Mapping auf `ContractListResponse`/`ContractDetailResponse`
 *   inkl. Sync-Metadaten (siehe TODO in `contracts.service.ts`).
 * - Kein Rate-Limiting gegen 403-vs-404-Enumeration (Security-Befund
 *   "hoch", bewusst nicht Teil dieser Auth-Story).
 */

import { AuthenticationError, type AuthGuardService } from '../auth/auth-guard.service';
import type { Contract } from './contract.types';
import type { ContractsService } from './contracts.service';

/** Minimaler, framework-unabhängiger Stellvertreter für einen HTTP-Request. */
export interface IncomingRequest {
  headers: {
    /** Erwartet: `Bearer <ZITADEL-Token>` (ADR 0004 Punkt 2). */
    authorization?: string;
  };
}

/**
 * Minimaler, framework-unabhängiger Stellvertreter für eine HTTP-Response.
 * In einer echten NestJS-Implementierung entfällt dieser Typ zugunsten
 * des vom Framework verwalteten Response-Objekts/Statuscodes.
 */
export type ControllerResult<T> =
  | { status: 200; body: T }
  | { status: 401; body: { error: AuthGuardFailureBody } }
  | { status: 403 }
  | { status: 404 };

interface AuthGuardFailureBody {
  reason: string;
}

export class ContractsController {
  constructor(
    private readonly authGuard: AuthGuardService,
    private readonly contracts: ContractsService,
  ) {}

  /** Entspricht künftig `GET /contracts` (AC1/AC2/AC5, ADR 0002 Punkt 2). */
  async listMyContracts(request: IncomingRequest): Promise<ControllerResult<Contract[]>> {
    try {
      const auth = await this.authGuard.authenticate(request.headers.authorization);
      const contracts = await this.contracts.listMyContracts(auth);
      return { status: 200, body: contracts };
    } catch (error) {
      return this.mapAuthErrorOrRethrow(error);
    }
  }

  /**
   * Entspricht künftig `GET /contracts/:contractId` (AC3/AC4). Das
   * 403-vs-404-Statuscode-Mapping folgt exakt ADR 0002 Punkt 4 und
   * `ContractsService.getMyContractById` — Kontraktdaten werden im
   * 403-Fall in keinem Fall ausgeliefert.
   */
  async getMyContractById(
    contractId: string,
    request: IncomingRequest,
  ): Promise<ControllerResult<Contract>> {
    try {
      const auth = await this.authGuard.authenticate(request.headers.authorization);
      const result = await this.contracts.getMyContractById(contractId, auth);

      switch (result.kind) {
        case 'ok':
          return { status: 200, body: result.contract };
        case 'not_found':
          return { status: 404 };
        case 'forbidden':
          return { status: 403 };
      }
    } catch (error) {
      return this.mapAuthErrorOrRethrow(error);
    }
  }

  private mapAuthErrorOrRethrow(error: unknown): ControllerResult<never> {
    if (error instanceof AuthenticationError) {
      // In einer echten NestJS-Implementierung: UnauthorizedException,
      // vom Framework automatisch als HTTP 401 ausgeliefert.
      return { status: 401, body: { error: { reason: error.reason } } };
    }
    throw error;
  }
}
