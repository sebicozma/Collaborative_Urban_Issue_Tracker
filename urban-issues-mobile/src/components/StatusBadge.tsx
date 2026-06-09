import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReportStatus } from '../types/api';

const COLORS: Record<ReportStatus, string> = {
  submitted: '#2563EB',
  in_review: '#D97706',
  classified: '#7C3AED',
  approved: '#16A34A',
  rejected: '#DC2626',
};

const LABELS: Record<ReportStatus, string> = {
  submitted: 'Submitted',
  in_review: 'In Review',
  classified: 'Classified',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const color = COLORS[status] ?? '#64748B';
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{LABELS[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
