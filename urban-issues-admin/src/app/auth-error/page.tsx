const MESSAGES: Record<string, string> = {
  not_admin:
    "Your account does not have the administrator role required to access this dashboard.",
  invalid_session:
    "Your sign-in session expired or was invalid. Please try signing in again.",
  exchange_failed:
    "Sign-in could not be completed (token exchange failed). Please try again.",
  no_id_token: "The identity provider did not return the expected identity token.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    (error && MESSAGES[error]) ?? "Something went wrong during sign-in.";

  return (
    <main style={{ maxWidth: 480, margin: "6rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Access denied</h1>
      <p>{message}</p>
      <a href="/login" style={{ display: "inline-block", marginTop: "1rem" }}>
        ← Back to sign in
      </a>
    </main>
  );
}
