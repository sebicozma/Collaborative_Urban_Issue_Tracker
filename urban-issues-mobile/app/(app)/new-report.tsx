import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { createReport } from '@/api/reports';
import { GeoPoint, ReportCategory } from '@/types/api';

const CATEGORIES: { value: ReportCategory; label: string; emoji: string }[] = [
  { value: 'road', label: 'Road', emoji: '🚧' },
  { value: 'lighting', label: 'Lighting', emoji: '💡' },
  { value: 'waste', label: 'Waste', emoji: '🗑️' },
  { value: 'water', label: 'Water', emoji: '💧' },
  { value: 'safety', label: 'Safety', emoji: '⚠️' },
  { value: 'other', label: 'Other', emoji: '📋' },
];

export default function NewReportScreen() {
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('road');
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleGetLocation() {
    setGettingLocation(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Location access is required to attach coordinates to the report.');
      setGettingLocation(false);
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    setGettingLocation(false);
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to attach photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
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
    if (!user) return;

    setSubmitting(true);
    try {
      const result = await createReport(user.accessToken, {
        title: title.trim(),
        description: description.trim(),
        category,
        location,
        attachments: photo ? [photo] : [],
      });

      Alert.alert(
        'Report submitted!',
        `Your report has been received.\nID: ${result.reportId.slice(0, 8)}…`,
        [{ text: 'Done', onPress: () => { setTitle(''); setDescription(''); setLocation(null); setPhoto(null); router.replace('/(app)/'); } }],
      );
    } catch (err: any) {
      Alert.alert('Submission failed', err.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

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
              <Text style={[styles.catLabel, category === c.value && styles.catLabelActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Provide as much detail as possible…"
          multiline
          numberOfLines={5}
          maxLength={5000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{description.length}/5000</Text>

        <Text style={styles.label}>Location *</Text>
        {location ? (
          <View style={styles.locationCard}>
            <Ionicons name="location" size={18} color="#16A34A" />
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
            <Ionicons name="locate" size={18} color="#2563EB" />
            <Text style={styles.locationButtonText}>
              {gettingLocation ? 'Getting location…' : 'Use My Location'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Photo (optional)</Text>
        {photo ? (
          <View>
            <Image source={{ uri: photo }} style={styles.photoPreview} />
            <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
              <Ionicons name="close-circle" size={26} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
            <Ionicons name="camera-outline" size={22} color="#64748B" />
            <Text style={styles.photoButtonText}>Add Photo</Text>
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
  catItemActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  catEmoji: { fontSize: 22, marginBottom: 4 },
  catLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  catLabelActive: { color: '#2563EB', fontWeight: '700' },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  locationCoords: {
    flex: 1,
    fontSize: 13,
    color: '#15803D',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  refreshLink: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  locationButtonText: { color: '#2563EB', fontWeight: '600', fontSize: 15 },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  photoButtonText: { color: '#64748B', fontSize: 15 },
  photoPreview: { width: '100%', height: 200, borderRadius: 10 },
  removePhoto: { position: 'absolute', top: 8, right: 8 },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
