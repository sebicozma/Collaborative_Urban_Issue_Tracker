/**
 * Login landing. A plain link to the login route handler triggers a top-level
 * navigation to the IdentityServer authorize endpoint (no client JS needed).
 */
export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-linear-to-br from-emerald-50 to-white p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl font-bold text-white">
          U
        </div>
        <h1 className="text-xl font-bold text-gray-900">Urban Issues Admin</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sign in with your administrator account to continue.
        </p>
        <a
          href="/api/auth/login"
          className="mt-6 block w-full rounded-lg bg-emerald-600 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Sign in
        </a>
      </div>
    </main>
  );
}
