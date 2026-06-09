import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

/**
 * Stateless BFF session. The encrypted, signed, httpOnly cookie holds the OIDC
 * tokens and a small set of user claims. The browser never sees raw tokens —
 * only the opaque sealed cookie. No database is involved; Duende IdentityServer
 * remains the single source of truth.
 */

export interface SessionUser {
  sub: string;
  name?: string;
  email?: string;
  roles: string[];
}

export interface SessionData {
  user?: SessionUser;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  /** Access-token expiry as epoch milliseconds. */
  expiresAt?: number;
}

/** Short-lived transaction cookie holding the PKCE/state/nonce between the
 *  authorization redirect and the callback. */
export interface AuthTxData {
  codeVerifier?: string;
  state?: string;
  nonce?: string;
}

const password = process.env.IRON_SESSION_PASSWORD;
if (!password || password.length < 32) {
  throw new Error(
    "IRON_SESSION_PASSWORD must be set to a string of at least 32 characters.",
  );
}

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  // Dev runs over http://localhost; secure cookies require HTTPS in production.
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

export const sessionOptions: SessionOptions = {
  password,
  cookieName: "ui_admin_session",
  cookieOptions: baseCookieOptions,
};

export const txSessionOptions: SessionOptions = {
  password,
  cookieName: "ui_admin_auth_tx",
  cookieOptions: { ...baseCookieOptions, maxAge: 60 * 10 },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function getAuthTx() {
  return getIronSession<AuthTxData>(await cookies(), txSessionOptions);
}

/** Coerces the `role` claim (string | string[] | undefined) into a string[]. */
export function normalizeRoles(role: unknown): string[] {
  if (Array.isArray(role)) {
    return role.filter((r): r is string => typeof r === "string");
  }
  if (typeof role === "string") return [role];
  return [];
}
