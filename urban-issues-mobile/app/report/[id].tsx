import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, Linking,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { getReport, updateReportStatus } from '@/api/reports';
import { ReportDetail, ReportStatus } from '@/types/api';
import { StatusBadge } from '@/components/StatusBadge';
import { CategoryBadge } from '@/components/CategoryBadge';

// Status transitions available to contractors and supervisors
const TRANSITIONS: ReportStatus[] = ['in_review', 'approved', 'rejected'];

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    getReport(user.accessToken, id)
      .then(setReport)
      .catch((e) => setError(e.message ?? 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [id, user]);

  async function handleStatusUpdate(newStatus: ReportStatus) {
    if (!user || !report) return;
    setUpdating(true);
    try {
      const result = await updateReportStatus(user.accessToken, report.reportId, { status: newStatus });
      setReport((prev) => prev ? { ...prev, status: result.currentStatus, updatedAt: result.updatedAt } : prev);
    } catch (err: any) {
      Alert.alert('Update failed', err.message ?? 'Something went wrong.');
    } finally {
      setUpdating(false);
    }
  }

  function openInMaps() {
    if (!report) return;
    Linking.openURL(`https://maps.google.com/?q=${report.location.lat},${report.location.lon}`);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  if (error || !report) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Report not found'}</Text>
      </View>
    );
  }

  const createdDate = new Date(report.createdAt).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const updatedDate = report.updatedAt
    ? new Date(report.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const canUpdateStatus = user?.role === 'contractor' || user?.role === 'admin' || user?.role === 'supervisor';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title and status */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{report.title}</Text>
        <StatusBadge status={report.status} />
      </View>

      <CategoryBadge category={report.category} />

      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={15} color="#64748B" />
          <Text style={styles.metaText}>{createdDate}</Text>
        </View>
        {updatedDate && (
          <View style={styles.metaRow}>
            <Ionicons name="refresh-outline" size={15} color="#64748B" />
            <Text style={styles.metaText}>Updated {updatedDate}</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Description</Text>
      <Text style={styles.description}>{report.description}</Text>

      <Text style={styles.sectionTitle}>Location</Text>
      <TouchableOpacity style={styles.locationCard} onPress={openInMaps} activeOpacity={0.75}>
        <Ionicons name="location" size={20} color="#2563EB" />
        <View style={{ flex: 1 }}>
          <Text style={styles.coords}>{report.location.lat.toFixed(5)}, {report.location.lon.toFixed(5)}</Text>
          <Text style={styles.coordsHint}>Tap to open in Maps</Text>
        </View>
        <Ionicons name="open-outline" size={16} color="#94A3B8" />
      </TouchableOpacity>

      {/* AI classification result (populated once the AI service runs) */}
      {report.classifiedCategory && (
        <View style={styles.aiCard}>
          <Text style={styles.aiLabel}>🤖 AI Classification</Text>
          <Text style={styles.aiValue}>{report.classifiedCategory}</Text>
        </View>
      )}

      {/* Status note set by a contractor/supervisor */}
      {report.statusReason && (
        <View style={styles.reasonCard}>
          <Text style={styles.reasonLabel}>Status Note</Text>
          <Text style={styles.reasonText}>{report.statusReason}</Text>
        </View>
      )}

      {/* Contractors and supervisors can update the status */}
      {canUpdateStatus && (
        <View style={styles.actions}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.actionRow}>
            {TRANSITIONS.filter((s) => s !== report.status).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.actionButton, updating && styles.actionButtonDisabled]}
                onPress={() => handleStatusUpdate(s)}
                disabled={updating}
              >
                <Text style={styles.actionButtonText}>
                  {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: '#64748B', fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 4 },
  description: { fontSize: 15, color: '#334155', lineHeight: 23, marginBottom: 20 },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
  },
  coords: { fontSize: 13, color: '#1E40AF', fontFamily: 'monospace', fontWeight: '500' },
  coordsHint: { fontSize: 11, color: '#3B82F6', marginTop: 2 },
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
  actions: { marginTop: 4 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  actionButtonDisabled: { opacity: 0.5 },
  actionButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
