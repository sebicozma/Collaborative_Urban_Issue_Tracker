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
    <main className="grid min-h-screen place-items-center bg-linear-to-br from-emerald-50 to-white p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-red-100 text-red-600">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Access denied</h1>
        <p className="mt-1 text-sm text-gray-500">{message}</p>
        <a
          href="/login"
          className="mt-6 block w-full rounded-lg bg-emerald-600 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Back to sign in
        </a>
      </div>
    </main>
  );
}
