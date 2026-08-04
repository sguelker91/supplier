/**
 * Echter NestJS-Guard, der die in `AuthGuardService` skizzierte Logik
 * (ADR 0002 Punkt 3 / ADR 0004 Punkt 2) an den HTTP-Layer anschließt.
 * Die Verifikationslogik selbst wird NICHT neu implementiert, sondern
 * ausschließlich über `AuthGuardService.authenticate()` wiederverwendet.
 */

import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { AuthenticationError, AuthGuardService } from './auth-guard.service';

/** Request, angereichert um den verifizierten Auth-Kontext (siehe `auth-context.decorator.ts`). */
export interface RequestWithAuthContext extends Request {
  authContext?: import('../contracts/contract.types').AuthenticatedSupplierContext;
}

@Injectable()
export class ZitadelAuthGuard implements CanActivate {
  constructor(private readonly authGuardService: AuthGuardService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthContext>();

    try {
      request.authContext = await this.authGuardService.authenticate(
        request.headers.authorization,
      );
      return true;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        // Jeder Fehlerfall aus AuthGuardService wird als HTTP 401 gemappt
        // (siehe Skizze in der bisherigen contracts.controller.ts) --
        // niemals ein stiller Fallback, der den Request durchlässt.
        throw new UnauthorizedException({ reason: error.reason, message: error.message });
      }
      throw error;
    }
  }
}
