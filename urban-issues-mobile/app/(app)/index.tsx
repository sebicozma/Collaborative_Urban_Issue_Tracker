import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { listReports } from '@/api/reports';
import { ReportSummary, ReportStatus } from '@/types/api';
import { ReportCard } from '@/components/ReportCard';

const FILTERS: { label: string; value: ReportStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Submitted', value: 'submitted' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export default function ReportsScreen() {
  const user = useAuthStore((s) => s.user);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ReportStatus | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (selectedFilter?: ReportStatus) => {
    if (!user) return;
    setError(null);
    try {
      const result = await listReports(user.accessToken, selectedFilter);
      setReports(result.items);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load reports');
    }
  }, [user]);

  useEffect(() => {
    fetchReports(filter).finally(() => setLoading(false));
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports(filter);
    setRefreshing(false);
  }, [filter, fetchReports]);

  function changeFilter(value: ReportStatus | undefined) {
    setFilter(value);
    setLoading(true);
  }

  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>Reports</Text>
        <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
      </View>

      {/* Horizontal status filter pills */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item.label}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.pill, filter === item.value && styles.pillActive]}
            onPress={() => changeFilter(item.value)}
          >
            <Text style={[styles.pillText, filter === item.value && styles.pillTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchReports(filter)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.reportId}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
          contentContainerStyle={reports.length === 0 ? styles.center : styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No reports here</Text>
              <Text style={styles.emptySubtitle}>Use the + tab to submit your first issue</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ReportCard
              report={item}
              onPress={() => router.push(`/report/${item.reportId}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  heading: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  greeting: { fontSize: 14, color: '#64748B' },
  filterRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  pillText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  pillTextActive: { color: '#FFFFFF' },
  list: { paddingVertical: 8, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#DC2626', marginBottom: 12, textAlign: 'center', paddingHorizontal: 32 },
  retryText: { color: '#2563EB', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
});
