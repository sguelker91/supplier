/**
 * Lieferberechtigungen-Screen für `apps/mobile` (Design-Canvas "Extranet
 * Mobile Modern"), Pendant zu
 * `apps/web/src/delivery-authorizations/DeliveryAuthorizationsListPage.tsx`.
 *
 * Bewusste Vereinfachungen ggü. dem Web-Pendant für diese erste Mobile-
 * Fassung:
 * - Zeitraum-Chip ist rein informativ/nicht interaktiv (kein Datepicker-
 *   Paket vorhanden, kein echter Datepicker Teil dieser Aufgabe); der
 *   angezeigte Bereich wird aber relativ zu "heute" berechnet, damit er
 *   nicht mit der Zeit veraltet.
 * - Keine Mehrfachauswahl/Bulk-Öffnen -- Zeilen sind einzeln antippbar.
 * - `onPress` ist ein No-Op (kein Mobile-Detail-Screen im Scope dieser
 *   Design-Überarbeitung).
 * - Synthetische `DEMO_DATA` statt echter `apps/api`-Anbindung, analog
 *   `ContractsScreen.tsx`.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DeliveryAuthorization } from '../../../api/src/delivery-authorizations/delivery-authorization.types';
import { DocumentIcon } from '../design-system/icons';
import { colors, fontFamily, spacing } from '../design-system/theme';

// Relativ zu "heute" berechnet, damit die Demo-Daten nicht mit der Zeit
// sichtbar veralten -- analog zu getDefaultDeliveryAuthorizationDateRange()
// in apps/web/src/delivery-authorizations/date-range-default.ts.
const today = new Date();
const todayIso = today.toISOString().slice(0, 10);

const FILTER_RANGE_DAYS = 6;

function formatDayMonth(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

function formatDayMonthYear(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const filterRangeEnd = new Date(today);
filterRangeEnd.setDate(filterRangeEnd.getDate() + FILTER_RANGE_DAYS);
const FILTER_RANGE_LABEL = `${formatDayMonth(today)}. – ${formatDayMonthYear(filterRangeEnd)}`;

const DEMO_ITEMS: DeliveryAuthorization[] = [
  {
    id: 'demo-da-1',
    supplierId: 'demo-supplier',
    callOffNumber: 'AB-100482',
    deliveryDate: todayIso,
    deliveryTime: '07:30',
    variety: 'Winterweizen A',
  },
  {
    id: 'demo-da-2',
    supplierId: 'demo-supplier',
    callOffNumber: 'AB-100491',
    deliveryDate: todayIso,
    deliveryTime: '11:00',
    variety: 'Braugerste',
  },
];

export function DeliveryAuthorizationsScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Lieferberechtigungen</Text>
        <Text style={styles.description}>Abrufe im gewählten Zeitraum</Text>

        {/* Rein informativ -- kein Datepicker in dieser ersten Mobile-Fassung. */}
        <View style={styles.filterChip}>
          <Text style={styles.filterChipText}>{FILTER_RANGE_LABEL}</Text>
        </View>
      </View>

      <ScrollView>
        {DEMO_ITEMS.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.callOffNumber}>{item.callOffNumber}</Text>
              <Text style={styles.rowSecondary}>{item.variety}</Text>
              <Text style={styles.rowMuted}>
                {item.deliveryDate} · {item.deliveryTime} Uhr
              </Text>
            </View>
            <DocumentIcon color={colors.textMuted} size={16} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { fontFamily: fontFamily.extraBold, fontSize: 22, color: colors.textPrimary },
  description: { fontFamily: fontFamily.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  filterChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipText: { fontFamily: fontFamily.semiBold, fontSize: 13, color: colors.textPrimary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowText: { flex: 1 },
  callOffNumber: { fontFamily: fontFamily.bold, fontSize: 15, color: colors.textPrimary },
  rowSecondary: { fontFamily: fontFamily.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  rowMuted: { fontFamily: fontFamily.regular, fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
});
