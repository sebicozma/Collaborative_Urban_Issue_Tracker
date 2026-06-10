import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCreateReport } from '@/api/hooks';
import { ApiError } from '@/api/http';
import { GeoPoint, ReportCategory } from '@/api/types';
import { Brand } from '@/constants/theme';

const CATEGORIES: { value: ReportCategory; label: string; emoji: string }[] = [
  { value: 'road', label: 'Road', emoji: '🚧' },
  { value: 'lighting', label: 'Lighting', emoji: '💡' },
  { value: 'waste', label: 'Waste', emoji: '🗑️' },
  { value: 'water', label: 'Water', emoji: '💧' },
  { value: 'safety', label: 'Safety', emoji: '⚠️' },
  { value: 'other', label: 'Other', emoji: '📋' },
];

export default function NewReportScreen() {
  const createReport = useCreateReport();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('road');
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  async function handleGetLocation() {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Location access is required to attach coordinates to the report.',
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    } catch {
      Alert.alert('Location error', 'Could not get your current location. Try again.');
    } finally {
      setGettingLocation(false);
    }
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setLocation(null);
    setCategory('road');
  }

  async function handleSubmit() {
    if (title.trim().length < 3) {
      Alert.alert('Validation', 'Title must be at least 3 characters.');
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert('Validation', 'Description must be at least 10 characters.');
      return;
    }
    if (!location) {
      Alert.alert('Location required', 'Please capture your GPS location before submitting.');
      return;
    }

    try {
      const result = await createReport.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        location,
      });
      Alert.alert(
        'Report submitted!',
        `Your report has been received.\nID: ${result.reportId.slice(0, 8)}…`,
        [
          {
            text: 'Done',
            onPress: () => {
              resetForm();
              router.replace('/');
            },
          },
        ],
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.problem.detail || err.problem.title
          : err instanceof Error
            ? err.message
            : 'Something went wrong.';
      Alert.alert('Submission failed', message);
    }
  }

  const submitting = createReport.isPending;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>New Report</Text>
        <Text style={styles.subtitle}>Describe the issue so the city can address it</Text>

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Large pothole on Oak Street"
          placeholderTextColor="#94A3B8"
          maxLength={180}
        />
        <Text style={styles.charCount}>{title.length}/180</Text>

        <Text style={styles.label}>Category *</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.catItem, category === c.value && styles.catItemActive]}
              onPress={() => setCategory(c.value)}
            >
              <Text style={styles.catEmoji}>{c.emoji}</Text>
              <Text style={[styles.catLabel, category === c.value && styles.catLabelActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Provide as much detail as possible…"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={5}
          maxLength={5000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{description.length}/5000</Text>

        <Text style={styles.label}>Location *</Text>
        {location ? (
          <View style={styles.locationCard}>
            <Text style={styles.locationPin}>📍</Text>
            <Text style={styles.locationCoords}>
              {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
            </Text>
            <TouchableOpacity onPress={handleGetLocation}>
              <Text style={styles.refreshLink}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleGetLocation}
            disabled={gettingLocation}
          >
            <Text style={styles.locationButtonText}>
              📍 {gettingLocation ? 'Getting location…' : 'Use My Location'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit Report'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingBottom: 48 },
  heading: { fontSize: 24, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 22, marginBottom: 8 },
  charCount: { fontSize: 11, color: '#94A3B8', textAlign: 'right', marginTop: 3 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  textArea: { minHeight: 120, paddingTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catItem: {
    width: '30%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  catItemActive: { borderColor: Brand.primary, backgroundColor: Brand.tint },
  catEmoji: { fontSize: 22, marginBottom: 4 },
  catLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  catLabelActive: { color: Brand.primaryDark, fontWeight: '700' },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.tint,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  locationPin: { fontSize: 16 },
  locationCoords: {
    flex: 1,
    fontSize: 13,
    color: Brand.primaryDark,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  refreshLink: { color: Brand.primary, fontSize: 13, fontWeight: '600' },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.tint,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  locationButtonText: { color: Brand.primaryDark, fontWeight: '600', fontSize: 15 },
  submitButton: {
    backgroundColor: Brand.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: Brand.onPrimary, fontSize: 16, fontWeight: '700' },
});
