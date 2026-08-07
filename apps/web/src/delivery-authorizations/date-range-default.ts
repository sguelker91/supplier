/**
 * PLATZHALTER (AC4, ADR 0009 Abschnitt 6): der fachliche Wert eines
 * "sinnvollen Standardzeitraums" für den Zeitraum-Filter ist laut Backlog
 * ("Offene Fragen") ausdrücklich UNGEKLÄRT (laufender Monat? kommende
 * N Tage? letzte N Tage?). Diese Funktion liefert bis zur fachlichen
 * Klärung einen klar als vorläufig markierten Platzhalterwert: "heute" bis
 * "heute + 30 Tage" -- KEINE fachliche Festlegung, nur ein technisch
 * nutzbarer Startwert, damit die Seite beim ersten Laden überhaupt einen
 * Zeitraum anfragen kann (ADR 0009 verlangt `from`/`to` als erforderliche
 * Query-Parameter, siehe `../../../api/src/delivery-authorizations/date-range.util.ts`).
 */
import type { DateRangeValue } from '../design-system/DateRangeFilter';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDefaultDeliveryAuthorizationDateRange(today: Date = new Date()): DateRangeValue {
  const to = new Date(today);
  to.setDate(to.getDate() + 30);

  return {
    from: toIsoDate(today),
    to: toIsoDate(to),
  };
}
