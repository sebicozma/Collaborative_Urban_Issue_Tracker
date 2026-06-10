import * as client from "openid-client";

/**
 * Server-side OIDC client configuration for the Urban Issues admin dashboard.
 *
 * This module runs the OpenID Connect authorization-code + PKCE flow against the
 * Duende IdentityServer using the certified `openid-client` (v6) library. It is
 * only ever imported by Route Handlers / Server Components, so the client secret
 * never reaches the browser.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const oidcConfig = {
  issuer: required("OIDC_ISSUER"),
  clientId: required("OIDC_CLIENT_ID"),
  clientSecret: required("OIDC_CLIENT_SECRET"),
  redirectUri: required("OIDC_REDIRECT_URI"),
  postLogoutRedirectUri: required("OIDC_POST_LOGOUT_REDIRECT_URI"),
  // offline_access => refresh token; roles => the "role" claim in the id_token;
  // the api scopes put the reports API audience on the access token used by
  // the dashboard's server-side reports fetch.
  scope:
    "openid profile email roles offline_access urban-issues-api.read urban-issues-api.write",
} as const;

let configPromise: Promise<client.Configuration> | undefined;

/**
 * Discovers and memoizes the IdentityServer configuration (`.well-known`).
 *
 * Note on local dev: the Identity server uses the ASP.NET self-signed dev cert.
 * Rather than disabling TLS verification, the `dev` npm script points Node at the
 * exported cert via NODE_EXTRA_CA_CERTS, so `discovery()`'s server-side fetch
 * trusts it. See README / .env.example.
 */
export function getOidcConfiguration(): Promise<client.Configuration> {
  if (!configPromise) {
    configPromise = client.discovery(
      new URL(oidcConfig.issuer),
      oidcConfig.clientId,
      oidcConfig.clientSecret,
      client.ClientSecretPost(oidcConfig.clientSecret),
    );
  }
  return configPromise;
}

export { client };
