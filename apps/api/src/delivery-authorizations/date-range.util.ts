/**
 * Validierung der `from`/`to`-Query-Parameter für
 * `GET /delivery-authorizations` (ADR 0009 Abschnitt 3): beide sind
 * ERFORDERLICH (400 bei Fehlen/Ungültigkeit) -- die Berechnung eines
 * "sinnvollen Standardzeitraums" (AC4) liegt bewusst in `apps/web`, nicht
 * hier (ADR 0009 Abschnitt 6).
 */
import { BadRequestException } from '@nestjs/common';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface DeliveryAuthorizationDateRange {
  from: string;
  to: string;
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * Wirft `BadRequestException` (400), wenn `from`/`to` fehlen, kein gültiges
 * ISO-8601-Datum (`YYYY-MM-DD`) sind, oder `from` nach `to` liegt.
 */
export function parseDeliveryAuthorizationDateRangeOrThrow(
  from: unknown,
  to: unknown,
): DeliveryAuthorizationDateRange {
  if (typeof from !== 'string' || from.length === 0 || typeof to !== 'string' || to.length === 0) {
    throw new BadRequestException(
      "Query-Parameter 'from' und 'to' sind erforderlich (ISO-8601-Datum, z. B. 2026-08-01).",
    );
  }

  if (!isValidIsoDate(from) || !isValidIsoDate(to)) {
    throw new BadRequestException(
      "Query-Parameter 'from'/'to' müssen gültige ISO-8601-Datumswerte sein (YYYY-MM-DD).",
    );
  }

  if (from > to) {
    throw new BadRequestException("Query-Parameter 'from' darf nicht nach 'to' liegen.");
  }

  return { from, to };
}
