import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { router, Link } from 'expo-router';
import { login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { getUsers } from '@/api/mock/store';
import { API_CONFIG } from '@/api/config';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in your email and password.');
      return;
    }

    setLoading(true);
    try {
      const token = await login({ email: email.trim(), password });

      // Look up profile data to persist in the local session.
      // In mock mode we read from AsyncStorage; with a real API you'd call /connect/userinfo.
      let fullName = email;
      let role: 'citizen' | 'contractor' | 'admin' | 'supervisor' = 'citizen';
      let userId = '';

      if (API_CONFIG.useMock) {
        const users = await getUsers();
        const found = users.find((u) => u.email === email.trim());
        if (found) {
          fullName = found.fullName;
          role = found.role;
          userId = found.userId;
        }
      }

      await setUser({ userId, email: email.trim(), fullName, role, accessToken: token.accessToken });
      router.replace('/(app)/');
    } catch (err: any) {
      Alert.alert('Login failed', err.problem?.detail ?? err.message ?? 'Something went wrong.');
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
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🏙️</Text>
          <Text style={styles.appName}>Urban Pulse</Text>
          <Text style={styles.tagline}>City issue reporting</Text>
        </View>

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

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.mutedText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Register</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  hero: { alignItems: 'center', marginBottom: 44 },
  heroEmoji: { fontSize: 56 },
  appName: { fontSize: 28, fontWeight: '700', color: '#1E293B', marginTop: 8 },
  tagline: { fontSize: 15, color: '#64748B', marginTop: 4 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 16 },
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
