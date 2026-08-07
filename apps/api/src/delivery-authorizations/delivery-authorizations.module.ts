import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DELIVERY_AUTHORIZATION_REPOSITORY } from './delivery-authorization-repository.token';
import { DeliveryAuthorizationsController } from './delivery-authorizations.controller';
import { DeliveryAuthorizationsService } from './delivery-authorizations.service';
import { InMemoryDeliveryAuthorizationRepository } from './in-memory-delivery-authorization.repository';

@Module({
  imports: [AuthModule],
  controllers: [DeliveryAuthorizationsController],
  providers: [
    DeliveryAuthorizationsService,
    // ÜBERGANGSLÖSUNG: In-Memory-Repository, siehe
    // in-memory-delivery-authorization.repository.ts.
    { provide: DELIVERY_AUTHORIZATION_REPOSITORY, useClass: InMemoryDeliveryAuthorizationRepository },
  ],
  // Export für DocumentsModule (ADR 0009 Abschnitt 8: zusätzlicher
  // Ownership-Check gegen DeliveryAuthorizationsService).
  exports: [DeliveryAuthorizationsService],
})
export class DeliveryAuthorizationsModule {}
