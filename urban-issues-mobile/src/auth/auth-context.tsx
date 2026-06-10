import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AUTH_CONFIG } from '@/api/config';

import { decodeIdToken } from './jwt';
import { clearSession, loadSession, saveSession, StoredUser } from './token-store';

/** Refresh this many ms before the access token actually expires. */
const EXPIRY_SKEW_MS = 60_000;

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
  /**
   * Returns a valid access token, transparently refreshing it via the stored
   * refresh token when it is expired or within {@link EXPIRY_SKEW_MS} of expiry.
   * The data layer calls this before every request. Returns null when there is
   * no session (or the refresh failed, in which case the session is cleared).
   */
  getAccessToken: (opts?: { force?: boolean }) => Promise<string | null>;
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

  // Refs are the source of truth for getAccessToken so it never reads a stale
  // closure: the access token, when it expires, the refresh token, and the
  // currently in-flight refresh (to dedupe concurrent callers).
  const accessTokenRef = useRef<string | null>(null);
  const expiresAtRef = useRef<number>(0);
  const refreshTokenRef = useRef<string | null>(null);
  const refreshInFlightRef = useRef<Promise<string | null> | null>(null);

  // Records a freshly minted token in both the refs and (for the access token) state.
  const storeTokens = useCallback((token: TokenResponse) => {
    accessTokenRef.current = token.access_token;
    expiresAtRef.current = Date.now() + (token.expires_in ?? 3600) * 1000;
    if (token.refresh_token) refreshTokenRef.current = token.refresh_token;
    setAccessToken(token.access_token);
  }, []);

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
      storeTokens(token);
      setUser(nextUser);
      if (token.refresh_token) {
        await saveSession({ refreshToken: token.refresh_token, user: nextUser });
      }
      return nextUser;
    },
    [storeTokens],
  );

  const signOut = useCallback(async () => {
    await clearSession();
    accessTokenRef.current = null;
    expiresAtRef.current = 0;
    refreshTokenRef.current = null;
    setAccessToken(null);
    setUser(null);
  }, []);

  const getAccessToken = useCallback(
    async ({ force = false }: { force?: boolean } = {}): Promise<string | null> => {
      const fresh =
        !!accessTokenRef.current && Date.now() < expiresAtRef.current - EXPIRY_SKEW_MS;
      if (!force && fresh) return accessTokenRef.current;

      // Coalesce concurrent refreshes into a single token request.
      if (refreshInFlightRef.current) return refreshInFlightRef.current;

      const refreshToken = refreshTokenRef.current;
      if (!refreshToken) return null;

      const inFlight = (async () => {
        try {
          const token = await postToken({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: AUTH_CONFIG.clientId,
          });
          storeTokens(token);
          // Persist the rotated refresh token alongside the existing user.
          const stored = await loadSession();
          if (token.refresh_token && stored) {
            await saveSession({ refreshToken: token.refresh_token, user: stored.user });
          }
          return token.access_token;
        } catch {
          await signOut();
          return null;
        } finally {
          refreshInFlightRef.current = null;
        }
      })();

      refreshInFlightRef.current = inFlight;
      return inFlight;
    },
    [signOut, storeTokens],
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
      refreshTokenRef.current = stored.refreshToken;
      try {
        const token = await postToken({
          grant_type: 'refresh_token',
          refresh_token: stored.refreshToken,
          client_id: AUTH_CONFIG.clientId,
        });
        if (!active) return;
        storeTokens(token);
        if (token.refresh_token) {
          await saveSession({ refreshToken: token.refresh_token, user: stored.user });
        }
      } catch {
        await clearSession();
        refreshTokenRef.current = null;
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [storeTokens]);

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

  const value = useMemo<AuthState>(
    () => ({
      isLoading,
      isAuthenticating,
      isAuthenticated: !!user,
      user,
      accessToken,
      signIn,
      signOut,
      getAccessToken,
    }),
    [isLoading, isAuthenticating, user, accessToken, signIn, signOut, getAccessToken],
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
