import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { Brand } from '@/constants/theme';

export default function LoginScreen() {
  const { signIn, isAuthenticating } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setError(null);
    try {
      await signIn(username.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Text style={styles.logoMark}>UP</Text>
            </View>
            <Text style={styles.appName}>Urban Pulse</Text>
            <Text style={styles.tagline}>Report city issues. Track the fix.</Text>
          </View>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="alice"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            placeholderTextColor="#6b7280"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={handleSignIn}
          />

          <Pressable
            style={({ pressed }) => [
              styles.button,
              (pressed || isAuthenticating) && styles.buttonPressed,
            ]}
            onPress={handleSignIn}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator color={Brand.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primaryDarker,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    height: 72,
    width: 72,
    borderRadius: 20,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoMark: {
    color: Brand.onPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
  },
  appName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#f0fdf4',
  },
  tagline: {
    fontSize: 15,
    color: Brand.accent,
    marginTop: 6,
  },
  label: {
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: '#0f172a',
  },
  button: {
    backgroundColor: Brand.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    minHeight: 56,
  },
  buttonPressed: {
    backgroundColor: Brand.primaryDark,
  },
  buttonText: {
    color: Brand.onPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  error: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 18,
  },
});
