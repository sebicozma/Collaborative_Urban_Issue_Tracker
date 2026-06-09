export default function LoginPage() {
  return (
    <main style={{ maxWidth: 480, margin: "6rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Urban Issues Admin</h1>
      <p>Sign in with your administrator account to continue.</p>
      <a
        href="/api/auth/login"
        style={{
          display: "inline-block",
          marginTop: "1rem",
          padding: "0.6rem 1.2rem",
          background: "#1a1a1a",
          color: "#fff",
          borderRadius: 6,
          textDecoration: "none",
        }}
      >
        Sign in
      </a>
    </main>
  );
}
