import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { AUTH_CONFIG } from '@/api/config';

import { decodeIdToken } from './jwt';
import { clearSession, loadSession, saveSession, StoredUser } from './token-store';

type AuthState = {
  /** Restoring a persisted session on launch (keep the splash up while true). */
  isLoading: boolean;
  /** A sign-in request is in flight. */
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  user: StoredUser | null;
  /** Bearer token for the Reports API. Held in memory only. */
  accessToken: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

/** Raw Duende token endpoint response (snake_case). */
type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

function pickRole(role?: string | string[]): string {
  if (Array.isArray(role)) return role[0] ?? 'citizen';
  return role ?? 'citizen';
}

function formEncode(body: Record<string, string>): string {
  return Object.entries(body)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

/** POSTs a grant to Duende's token endpoint and returns the parsed tokens. */
async function postToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(AUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: formEncode(body),
  });

  const data = await res.json().catch(() => ({}) as Record<string, string>);
  if (!res.ok) {
    // Duende returns { error, error_description } on failure.
    throw new Error(data.error_description || data.error || `Sign-in failed (${res.status}).`);
  }
  return data as TokenResponse;
}

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Builds the in-memory user from the token claims and persists the refresh session.
  const applyToken = useCallback(
    async (token: TokenResponse, fallbackName?: string): Promise<StoredUser> => {
      // ROPC has no id_token; the access token (a JWT) carries sub + role.
      const claims = decodeIdToken(token.id_token ?? token.access_token);
      const nextUser: StoredUser = {
        userId: claims.sub ?? '',
        name: claims.name ?? claims.given_name ?? fallbackName ?? claims.email ?? 'User',
        email: claims.email ?? '',
        role: pickRole(claims.role),
      };
      setAccessToken(token.access_token);
      setUser(nextUser);
      if (token.refresh_token) {
        await saveSession({ refreshToken: token.refresh_token, user: nextUser });
      }
      return nextUser;
    },
    [],
  );

  // On launch, restore the session: show the stored user, then mint a fresh access
  // token from the refresh token.
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await loadSession();
      if (!stored) {
        if (active) setIsLoading(false);
        return;
      }
      if (active) setUser(stored.user);
      try {
        const token = await postToken({
          grant_type: 'refresh_token',
          refresh_token: stored.refreshToken,
          client_id: AUTH_CONFIG.clientId,
        });
        if (!active) return;
        setAccessToken(token.access_token);
        if (token.refresh_token) {
          await saveSession({ refreshToken: token.refresh_token, user: stored.user });
        }
      } catch {
        await clearSession();
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (username: string, password: string) => {
      setIsAuthenticating(true);
      try {
        const token = await postToken({
          grant_type: 'password',
          username,
          password,
          scope: AUTH_CONFIG.scopes.join(' '),
          client_id: AUTH_CONFIG.clientId,
        });
        await applyToken(token, username);
      } finally {
        setIsAuthenticating(false);
      }
    },
    [applyToken],
  );

  const signOut = useCallback(async () => {
    await clearSession();
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      isLoading,
      isAuthenticating,
      isAuthenticated: !!user,
      user,
      accessToken,
      signIn,
      signOut,
    }),
    [isLoading, isAuthenticating, user, accessToken, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
