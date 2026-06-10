export type IdTokenClaims = {
  sub?: string;
  name?: string;
  given_name?: string;
  email?: string;
  role?: string | string[];
};

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  // Hermes provides a global atob (RN 0.74+).
  const binary = globalThis.atob(padded);
  // Reconstruct UTF-8 from the binary string so non-ASCII names survive.
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeIdToken(idToken: string): IdTokenClaims {
  const parts = idToken.split('.');
  if (parts.length < 2) return {};
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as IdTokenClaims;
  } catch {
    return {};
  }
}
