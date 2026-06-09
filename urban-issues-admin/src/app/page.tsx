import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();

  if (!session.user) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <main style={{ maxWidth: 640, margin: "4rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Urban Issues Admin</h1>
      <p>You are signed in as an administrator.</p>

      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.25rem 1rem", marginTop: "1.5rem" }}>
        <dt style={{ fontWeight: 600 }}>Name</dt>
        <dd style={{ margin: 0 }}>{user.name ?? "—"}</dd>
        <dt style={{ fontWeight: 600 }}>Email</dt>
        <dd style={{ margin: 0 }}>{user.email ?? "—"}</dd>
        <dt style={{ fontWeight: 600 }}>Roles</dt>
        <dd style={{ margin: 0 }}>{user.roles.join(", ")}</dd>
        <dt style={{ fontWeight: 600 }}>Subject</dt>
        <dd style={{ margin: 0 }}>
          <code>{user.sub}</code>
        </dd>
      </dl>

      <form action="/api/auth/logout" method="post" style={{ marginTop: "2rem" }}>
        <button type="submit" style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
          Sign out
        </button>
      </form>
    </main>
  );
}
