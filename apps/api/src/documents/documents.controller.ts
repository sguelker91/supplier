/**
 * Echter NestJS-Controller für
 * `GET /documents?subjectType=delivery-authorization&subjectId=<id>`
 * (ADR 0009 Abschnitt 8), hinter demselben `ZitadelAuthGuard` wie
 * `delivery-authorizations`/`contracts`.
 *
 * WICHTIG (Mandantentrennungs-Lücke, ADR 0009 Abschnitt 8): Dieser
 * Controller verifiziert VOR dem Aufruf von `DocumentProvider` zusätzlich
 * die Eigentümerschaft des referenzierten `subjectId`, indem er (für
 * `subjectType === 'delivery-authorization'`) denselben Ownership-Check
 * wie `GET /delivery-authorizations/:id` über
 * `DeliveryAuthorizationsService` durchführt (404/403 analog). Eine reine
 * Delegation an `DocumentProvider` (aktuell `StubDocumentProvider`, der
 * IMMER eine leere Liste liefert) würde diese Lücke NICHT abdecken, weil
 * der Stub für jede `subjectId` unterschiedslos `200 []` liefert --
 * ein Lieferant könnte sonst über direkte `subjectId`-Manipulation fremde
 * `subjectId`-Werte "erfolgreich" abfragen (nur zufällig mit leerem
 * Ergebnis, solange der Stub aktiv ist), ohne dass die Mandantentrennung
 * tatsächlich durchgesetzt würde.
 *
 * Falls künftig weitere `subjectType`-Werte hinzukommen, ist dieser direkt
 * verdrahtete Ownership-Check durch eine generische Registry/Strategie zu
 * ersetzen (ADR 0009 Abschnitt 8, "bewusst nicht heute vorgezogen").
 */

import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthContext } from '../auth/auth-context.decorator';
import { ZitadelAuthGuard } from '../auth/zitadel-auth.guard';
import type { AuthenticatedSupplierContext } from '../contracts/contract.types';
import { DeliveryAuthorizationsService } from '../delivery-authorizations/delivery-authorizations.service';
import { DOCUMENT_PROVIDER } from './document-provider.token';
import type { DocumentProvider, DocumentReference, DocumentSubjectType } from './document.types';

const KNOWN_SUBJECT_TYPES: readonly DocumentSubjectType[] = ['delivery-authorization'];

@Controller('documents')
@UseGuards(ZitadelAuthGuard)
export class DocumentsController {
  constructor(
    @Inject(DOCUMENT_PROVIDER) private readonly documentProvider: DocumentProvider,
    private readonly deliveryAuthorizations: DeliveryAuthorizationsService,
  ) {}

  @Get()
  async listDocuments(
    @Query('subjectType') subjectType: string,
    @Query('subjectId') subjectId: string,
    @AuthContext() auth: AuthenticatedSupplierContext,
  ): Promise<DocumentReference[]> {
    if (!subjectType || !subjectId) {
      throw new BadRequestException(
        "Query-Parameter 'subjectType' und 'subjectId' sind erforderlich.",
      );
    }

    if (!KNOWN_SUBJECT_TYPES.includes(subjectType as DocumentSubjectType)) {
      throw new BadRequestException(`Unbekannter subjectType: ${subjectType}`);
    }

    // Zweite, zusätzliche Ownership-Prüfung (siehe Klassenkommentar) --
    // NICHT durch eine reine Delegation an `documentProvider` ersetzbar.
    // Exhaustiveness-Check (Security-Bericht `lieferberechtigungen-anzeigen.md`,
    // "mittel"-Befund): der `never`-Fallback im `default`-Zweig lässt den
    // Compiler fehlschlagen, sobald `DocumentSubjectType` um einen neuen Wert
    // erweitert wird, ohne dass hier ein passender Ownership-Check ergänzt
    // wurde -- verhindert, dass ein künftiger `subjectType` versehentlich
    // ohne Mandantentrennungsprüfung an `documentProvider` durchgereicht wird.
    await this.assertOwnership(subjectType as DocumentSubjectType, subjectId, auth);

    return this.documentProvider.listDocuments({
      subjectType: subjectType as DocumentSubjectType,
      subjectId,
    });
  }

  private async assertOwnership(
    subjectType: DocumentSubjectType,
    subjectId: string,
    auth: AuthenticatedSupplierContext,
  ): Promise<void> {
    switch (subjectType) {
      case 'delivery-authorization': {
        const ownership = await this.deliveryAuthorizations.getMyDeliveryAuthorizationById(
          subjectId,
          auth,
        );
        switch (ownership.kind) {
          case 'not_found':
            throw new NotFoundException();
          case 'forbidden':
            throw new ForbiddenException();
          case 'ok':
            return;
        }
        break;
      }
      default: {
        // Zwingt bei Erweiterung von `DocumentSubjectType` einen Compile-Fehler,
        // bis dieser Zweig um den passenden Ownership-Check ergänzt wird.
        const exhaustiveCheck: never = subjectType;
        throw new Error(`Kein Ownership-Check für subjectType definiert: ${exhaustiveCheck}`);
      }
    }
  }
}
