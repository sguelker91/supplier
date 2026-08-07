import { Module } from '@nestjs/common';

import { ContractsModule } from './contracts/contracts.module';
import { DeliveryAuthorizationsModule } from './delivery-authorizations/delivery-authorizations.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [ContractsModule, DeliveryAuthorizationsModule, DocumentsModule],
})
export class AppModule {}
