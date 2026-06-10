import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useReport } from '@/api/hooks';
import { CategoryBadge } from '@/components/reports/CategoryBadge';
import { StatusBadge } from '@/components/reports/StatusBadge';
import { Brand } from '@/constants/theme';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: report, isLoading, isError, error } = useReport(id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  if (isError || !report) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'Report not found'}
        </Text>
      </View>
    );
  }

  const createdDate = new Date(report.createdAt).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const updatedDate = report.updatedAt
    ? new Date(report.updatedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  function openInMaps() {
    if (!report) return;
    Linking.openURL(`https://maps.google.com/?q=${report.location.lat},${report.location.lon}`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{report.title}</Text>
        <StatusBadge status={report.status} />
      </View>

      <CategoryBadge category={report.category} />

      <View style={styles.meta}>
        <Text style={styles.metaText}>🗓️ {createdDate}</Text>
        {updatedDate && <Text style={styles.metaText}>🔄 Updated {updatedDate}</Text>}
      </View>

      <Text style={styles.sectionTitle}>Description</Text>
      <Text style={styles.description}>{report.description}</Text>

      <Text style={styles.sectionTitle}>Location</Text>
      <TouchableOpacity style={styles.locationCard} onPress={openInMaps} activeOpacity={0.75}>
        <Text style={styles.locationPin}>📍</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.coords}>
            {report.location.lat.toFixed(5)}, {report.location.lon.toFixed(5)}
          </Text>
          <Text style={styles.coordsHint}>Tap to open in Maps</Text>
        </View>
      </TouchableOpacity>

      {/* AI classification result (populated once the classification service runs). */}
      {report.classifiedCategory && (
        <View style={styles.aiCard}>
          <Text style={styles.aiLabel}>🤖 AI Classification</Text>
          <Text style={styles.aiValue}>{report.classifiedCategory}</Text>
        </View>
      )}

      {/* Status note set on the admin side when a status changes. */}
      {report.statusReason && (
        <View style={styles.reasonCard}>
          <Text style={styles.reasonLabel}>Status Note</Text>
          <Text style={styles.reasonText}>{report.statusReason}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  errorText: { color: '#DC2626', fontSize: 16 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  title: { flex: 1, fontSize: 22, fontWeight: '700', color: '#1E293B' },
  meta: { marginTop: 14, marginBottom: 20, gap: 6 },
  metaText: { color: '#64748B', fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 4 },
  description: { fontSize: 15, color: '#334155', lineHeight: 23, marginBottom: 20 },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Brand.tint,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 20,
  },
  locationPin: { fontSize: 18 },
  coords: { fontSize: 13, color: Brand.primaryDark, fontWeight: '500' },
  coordsHint: { fontSize: 11, color: Brand.primary, marginTop: 2 },
  aiCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 14,
  },
  aiLabel: { color: '#7C3AED', fontSize: 13, fontWeight: '600' },
  aiValue: { color: '#6D28D9', fontSize: 13, fontWeight: '500' },
  reasonCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  reasonLabel: { fontSize: 12, color: '#92400E', fontWeight: '700', marginBottom: 4 },
  reasonText: { fontSize: 14, color: '#78350F' },
});
