import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DeliveryAuthorizationsModule } from '../delivery-authorizations/delivery-authorizations.module';
import { DOCUMENT_PROVIDER } from './document-provider.token';
import { DocumentsController } from './documents.controller';
import { StubDocumentProvider } from './stub-document.provider';

@Module({
  imports: [AuthModule, DeliveryAuthorizationsModule],
  controllers: [DocumentsController],
  providers: [
    // ÜBERGANGSLÖSUNG: Stub-Provider, siehe stub-document.provider.ts.
    { provide: DOCUMENT_PROVIDER, useClass: StubDocumentProvider },
  ],
})
export class DocumentsModule {}
