/**
 * Kontrakte-Screen für `apps/mobile` (Design-Canvas "Extranet Mobile
 * Modern"), Pendant zu `apps/web/src/contracts/ContractsListPage.tsx`.
 *
 * Wie beim Web-Pendant weiterhin offensichtlich synthetische `DEMO_DATA`
 * statt einer echten Anbindung an `apps/api` -- eine Mobile-API-Anbindung
 * ist bewusst NICHT Teil dieser Design-Überarbeitung (siehe
 * `docs/backlog/lieferant-kontrakte-einsehen.md`).
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ContractListItem } from '../../../api/src/contracts/contract.types';
import { colors, fontFamily, spacing } from '../design-system/theme';

const DEMO_DATA: { contracts: ContractListItem[]; lastSuccessfulSyncAt: string } = {
  contracts: [
    {
      id: 'demo-contract-1',
      contractNumber: 'DEMO-KONTRAKT-1',
      articleOrProductGroup: 'Demo-Warengruppe',
      agreedQuantity: { value: 100, unit: 'kg' },
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      status: 'active',
    },
    {
      id: 'demo-contract-2',
      contractNumber: 'DEMO-KONTRAKT-2',
      articleOrProductGroup: 'Demo-Warengruppe B',
      agreedQuantity: { value: 40, unit: 't' },
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      status: 'expired',
    },
  ],
  lastSuccessfulSyncAt: '2026-08-04T08:00:00Z',
};

export function ContractsScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Kontrakte</Text>
        <Text accessibilityRole="text" style={styles.syncStatus}>
          Aktualisiert: {DEMO_DATA.lastSuccessfulSyncAt}
        </Text>
      </View>

      <ScrollView>
        {DEMO_DATA.contracts.map((contract) => {
          const isExpired = contract.status === 'expired';
          return (
            <View key={contract.id} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.contractNumber}>{contract.contractNumber}</Text>
                <Text style={styles.rowSecondary}>
                  {contract.articleOrProductGroup} · {contract.agreedQuantity.value} {contract.agreedQuantity.unit}
                </Text>
                <Text style={styles.rowMuted}>
                  {contract.validFrom} – {contract.validTo}
                </Text>
              </View>
              <View style={styles.statusCell}>
                <View style={[styles.statusDot, { backgroundColor: isExpired ? colors.textMuted : colors.accent }]} />
                <Text style={[styles.statusText, isExpired ? styles.statusTextExpired : null]}>
                  {isExpired ? 'Abgelaufen' : 'Aktiv'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { fontFamily: fontFamily.extraBold, fontSize: 22, color: colors.textPrimary },
  syncStatus: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
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
  contractNumber: { fontFamily: fontFamily.bold, fontSize: 15, color: colors.textPrimary },
  rowSecondary: { fontFamily: fontFamily.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  rowMuted: { fontFamily: fontFamily.regular, fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  statusCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: fontFamily.semiBold, fontSize: 12.5, color: colors.textPrimary },
  statusTextExpired: { color: colors.textMuted },
});
