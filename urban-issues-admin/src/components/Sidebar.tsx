import Link from "next/link";

import type { SessionUser } from "@/lib/session";

function initials(name?: string, email?: string): string {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

const navBase = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors";
const navActive = "bg-emerald-600 font-medium text-white";
const navIdle = "text-emerald-100/80 hover:bg-emerald-900";

export default function Sidebar({
  active,
  user,
}: {
  active: "map" | "reports";
  user: SessionUser;
}) {
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-emerald-950 p-4 text-emerald-50">
      <div className="flex items-center gap-3 px-2 pb-6 pt-1">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-base font-bold text-white">
          U
        </div>
        <div>
          <div className="text-sm font-bold leading-tight">Urban Issues</div>
          <div className="text-xs text-emerald-300/80">Admin dashboard</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <Link href="/" className={`${navBase} ${active === "map" ? navActive : navIdle}`}>
          <PinIcon />
          Map
        </Link>
        <Link
          href="/reports"
          className={`${navBase} ${active === "reports" ? navActive : navIdle}`}
        >
          <ListIcon />
          Reports
        </Link>
      </nav>

      <div className="flex flex-col gap-3 border-t border-emerald-900 pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-semibold text-white">
            {initials(user.name, user.email)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user.name ?? user.sub}</div>
            {user.email && (
              <div className="truncate text-xs text-emerald-300/80">{user.email}</div>
            )}
          </div>
        </div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg border border-emerald-800 py-2 text-sm font-medium text-emerald-50 transition-colors hover:bg-emerald-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

function PinIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
