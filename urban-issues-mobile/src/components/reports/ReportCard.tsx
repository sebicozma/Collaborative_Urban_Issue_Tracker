import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ReportSummary } from '@/api/types';

import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';

interface Props {
  report: ReportSummary;
  onPress: () => void;
}

export function ReportCard({ report, onPress }: Props) {
  const date = new Date(report.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {report.title}
        </Text>
        <StatusBadge status={report.status} />
      </View>
      <View style={styles.footer}>
        <CategoryBadge category={report.category} />
        <Text style={styles.date}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
