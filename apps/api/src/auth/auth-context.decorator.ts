/**
 * Param-Decorator, der den von `ZitadelAuthGuard` auf dem Request
 * abgelegten `AuthenticatedSupplierContext` extrahiert. Damit greifen
 * Controller-Methoden niemals selbst auf Header/Request-Interna zu --
 * die einzige Quelle für `supplierId` bleibt der Guard (ADR 0002 Punkt 1).
 */

import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

import type { AuthenticatedSupplierContext } from '../contracts/contract.types';
import type { RequestWithAuthContext } from './zitadel-auth.guard';

export const AuthContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedSupplierContext => {
    const request = ctx.switchToHttp().getRequest<RequestWithAuthContext>();
    if (!request.authContext) {
      // Sollte nie eintreten, wenn @UseGuards(ZitadelAuthGuard) gesetzt ist --
      // Fail-Closed statt eines stillen `undefined`-Fallbacks.
      throw new Error(
        'AuthContext angefordert, aber kein verifizierter Auth-Kontext auf dem Request vorhanden ' +
          '(fehlt @UseGuards(ZitadelAuthGuard)?).',
      );
    }
    return request.authContext;
  },
);
