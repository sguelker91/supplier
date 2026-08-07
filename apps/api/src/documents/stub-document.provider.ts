/**
 * ÜBERGANGSLÖSUNG -- analog `InMemoryContractRepository`.
 *
 * Liefert IMMER eine leere Liste. Die reale D3-Cloud-Anbindung
 * (Authentifizierung, Datenformat, Fehlerverhalten bei Nichterreichbarkeit)
 * ist unbekannt (ADR 0009, "Offene Annahmen") und wird hier bewusst nicht
 * spekuliert. Ein künftiger `D3CloudDocumentProvider` kann das
 * `DocumentProvider`-Interface erfüllen, ohne `DocumentsController`,
 * `DeliveryAuthorizationsService` oder die Kernlogik von
 * `delivery-authorizations` zu ändern (erfüllt AC13 explizit).
 */

import { Injectable } from '@nestjs/common';

import type { DocumentProvider, DocumentReference, DocumentSubjectReference } from './document.types';

@Injectable()
export class StubDocumentProvider implements DocumentProvider {
  async listDocuments(_subject: DocumentSubjectReference): Promise<DocumentReference[]> {
    return [];
  }
}
