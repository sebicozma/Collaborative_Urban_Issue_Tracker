import * as SecureStore from 'expo-secure-store';

/**
 * Persists only the small, long-lived bits of the session in the OS keystore:
 * the refresh token plus a few display claims. The (larger) access token is kept
 * in memory and re-minted from the refresh token on launch — this keeps every
 * SecureStore value well under the platform size limits and limits exposure.
 */
export type StoredUser = {
  userId: string;
  name: string;
  email: string;
  role: string;
};

export type StoredSession = {
  refreshToken: string;
  user: StoredUser;
};

const REFRESH_TOKEN_KEY = 'urbanpulse.refreshToken';
const USER_KEY = 'urbanpulse.user';

export async function saveSession(session: StoredSession): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user)),
  ]);
}

export async function loadSession(): Promise<StoredSession | null> {
  const [refreshToken, userJson] = await Promise.all([
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY),
  ]);
  if (!refreshToken || !userJson) return null;
  try {
    return { refreshToken, user: JSON.parse(userJson) as StoredUser };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}
