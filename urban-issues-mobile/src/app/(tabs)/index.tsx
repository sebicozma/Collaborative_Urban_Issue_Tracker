import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReportsFeed } from '@/api/hooks';
import { ReportStatus } from '@/api/types';
import { ReportCard } from '@/components/reports/ReportCard';
import { useAuth } from '@/auth/auth-context';
import { Brand } from '@/constants/theme';

const FILTERS: { label: string; value: ReportStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Submitted', value: 'submitted' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export default function FeedScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<ReportStatus | undefined>(undefined);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReportsFeed(filter);

  const reports = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const firstName = user?.name?.split(' ')[0] ?? '';

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
        style={styles.filterList}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const active = filter === item.value;
          return (
            <TouchableOpacity
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => setFilter(item.value)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : 'Failed to load reports'}
          </Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.reportId}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
              tintColor={Brand.primary}
            />
          }
          contentContainerStyle={reports.length === 0 ? styles.center : styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={styles.footer} color={Brand.primary} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No reports here</Text>
              <Text style={styles.emptySubtitle}>Use the Report tab to submit the first issue</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ReportCard report={item} onPress={() => router.push(`/report/${item.reportId}`)} />
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
  // flexGrow:0 stops the horizontal list from stretching vertically to fill
  // empty space when there are few/no reports (it would otherwise look tall).
  filterList: { flexGrow: 0 },
  filterRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  pillText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  pillTextActive: { color: Brand.onPrimary },
  list: { paddingVertical: 8, paddingBottom: 24 },
  footer: { paddingVertical: 16 },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#DC2626', marginBottom: 12, textAlign: 'center', paddingHorizontal: 32 },
  retryText: { color: Brand.primary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
});
