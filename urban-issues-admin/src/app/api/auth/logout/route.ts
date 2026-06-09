import { redirect } from "next/navigation";
import { client, getOidcConfiguration, oidcConfig } from "@/lib/oidc";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Logout: destroys the local BFF session and performs a federated sign-out at
 * the IdentityServer end-session endpoint so the IdP SSO cookie is cleared too.
 * Exposed as POST (from the dashboard form) and GET (convenience).
 */
async function handleLogout() {
  const config = await getOidcConfiguration();
  const session = await getSession();
  const idToken = session.idToken;

  session.destroy();

  const endSessionUrl = client.buildEndSessionUrl(config, {
    post_logout_redirect_uri: oidcConfig.postLogoutRedirectUri,
    ...(idToken ? { id_token_hint: idToken } : {}),
  });

  redirect(endSessionUrl.href);
}

export async function POST() {
  return handleLogout();
}

export async function GET() {
  return handleLogout();
}
