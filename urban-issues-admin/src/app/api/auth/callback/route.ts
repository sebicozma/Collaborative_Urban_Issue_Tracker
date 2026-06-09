import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { client, getOidcConfiguration } from "@/lib/oidc";
import { getAuthTx, getSession, normalizeRoles } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/callback
 * Handles the authorization response: validates state/nonce, exchanges the code
 * (with PKCE) for tokens, enforces the admin-only rule, and establishes the BFF
 * session. Non-admins are rejected and no session is created.
 */
export async function GET(request: NextRequest) {
  const config = await getOidcConfiguration();
  const tx = await getAuthTx();

  if (!tx.codeVerifier || !tx.state || !tx.nonce) {
    tx.destroy();
    redirect("/auth-error?error=invalid_session");
  }

  let tokens: Awaited<ReturnType<typeof client.authorizationCodeGrant>>;
  try {
    tokens = await client.authorizationCodeGrant(config, new URL(request.url), {
      pkceCodeVerifier: tx.codeVerifier,
      expectedState: tx.state,
      expectedNonce: tx.nonce,
    });
  } catch {
    tx.destroy();
    redirect("/auth-error?error=exchange_failed");
  }

  // The tx cookie has served its purpose regardless of the outcome below.
  tx.destroy();

  const claims = tokens.claims();
  if (!claims?.sub) {
    redirect("/auth-error?error=no_id_token");
  }

  const roles = normalizeRoles(claims.role);
  if (!roles.includes("admin")) {
    redirect("/auth-error?error=not_admin");
  }

  const name = typeof claims.name === "string" ? claims.name : undefined;
  const email = typeof claims.email === "string" ? claims.email : undefined;
  const expiresIn = tokens.expiresIn();

  const session = await getSession();
  session.user = { sub: claims.sub, name, email, roles };
  session.accessToken = tokens.access_token;
  session.refreshToken = tokens.refresh_token;
  session.idToken = tokens.id_token;
  session.expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;
  await session.save();

  redirect("/");
}
