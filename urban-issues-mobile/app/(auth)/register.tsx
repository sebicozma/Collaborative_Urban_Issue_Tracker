import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { router, Link } from 'expo-router';
import { register } from '@/api/auth';
import { UserRole } from '@/types/api';

// Only citizen and contractor can register via the mobile app
const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'citizen', label: 'Citizen', description: 'Report issues in your area' },
  { value: 'contractor', label: 'Contractor', description: 'Fix reported issues' },
];

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<UserRole>('citizen');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords don\'t match', 'Please make sure both passwords are the same.');
      return;
    }
    if (password.length < 12) {
      Alert.alert('Weak password', 'Password must be at least 12 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({ email: email.trim(), password, fullName: fullName.trim(), role });
      Alert.alert('Account created!', 'You can now sign in with your new credentials.', [
        { text: 'Sign In', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err: any) {
      Alert.alert('Registration failed', err.problem?.detail ?? err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Urban Pulse to report issues in your city</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your full name"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password (min. 12 characters)</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Create a strong password"
          secureTextEntry
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Repeat your password"
          secureTextEntry
        />

        <Text style={styles.label}>I am a…</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.roleCard, role === r.value && styles.roleCardActive]}
              onPress={() => setRole(r.value)}
            >
              <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>{r.label}</Text>
              <Text style={styles.roleDesc}>{r.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.mutedText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 18 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: '#1E293B',
  },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleCard: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  roleCardActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  roleLabel: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 2 },
  roleLabelActive: { color: '#2563EB' },
  roleDesc: { fontSize: 12, color: '#94A3B8' },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  mutedText: { color: '#64748B', fontSize: 14 },
  link: { color: '#2563EB', fontSize: 14, fontWeight: '600' },
});
