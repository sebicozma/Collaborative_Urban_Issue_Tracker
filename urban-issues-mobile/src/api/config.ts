/**
 * Auth configuration for the mobile app.
 *
 * The app authenticates against the Duende IdentityServer using the password grant
 * (Resource Owner Password Credentials): it posts the username + password straight
 * to the token endpoint (see `src/auth/auth-context.tsx`). Values come from
 * EXPO_PUBLIC_* env vars (see .env) and are inlined at build time.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env and set it.`,
    );
  }
  return value;
}

const issuer = required('EXPO_PUBLIC_OIDC_ISSUER', process.env.EXPO_PUBLIC_OIDC_ISSUER);

export const AUTH_CONFIG = {
  /** Identity server base, e.g. http://127.0.0.1:5222 (over the adb-reverse tunnel). */
  issuer,
  /** Duende token endpoint for the password and refresh_token grants. */
  tokenEndpoint: `${issuer}/connect/token`,
  clientId: required('EXPO_PUBLIC_OIDC_CLIENT_ID', process.env.EXPO_PUBLIC_OIDC_CLIENT_ID),
  /**
   * offline_access yields a refresh token; the api scopes authorize the Reports API
   * and (via the API resource's user claims) carry the `role` claim in the access token.
   */
  scopes: ['urban-issues-api.read', 'urban-issues-api.write', 'offline_access'],
} as const;
