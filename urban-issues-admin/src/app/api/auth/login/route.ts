import { redirect } from "next/navigation";
import { client, getOidcConfiguration, oidcConfig } from "@/lib/oidc";
import { getAuthTx } from "@/lib/session";

// Always run dynamically — this initiates an OAuth flow with per-request secrets.
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/login
 * Generates PKCE/state/nonce, stashes them in the short-lived tx cookie, and
 * redirects the browser to the IdentityServer authorization endpoint.
 */
export async function GET() {
  const config = await getOidcConfiguration();

  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const nonce = client.randomNonce();

  const tx = await getAuthTx();
  tx.codeVerifier = codeVerifier;
  tx.state = state;
  tx.nonce = nonce;
  await tx.save();

  const authorizationUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: oidcConfig.redirectUri,
    scope: oidcConfig.scope,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
  });

  redirect(authorizationUrl.href);
}
