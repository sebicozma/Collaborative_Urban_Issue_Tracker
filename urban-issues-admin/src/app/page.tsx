import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import MapView from "@/components/MapView";

function initials(name?: string, email?: string): string {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

/**
 * Dashboard home: a branded emerald sidebar (nav + sign-out) and a full-height
 * map as the main content. Auth is gated in this server component.
 */
export default async function Home() {
  const session = await getSession();

  if (!session.user) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
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
          <span className="flex items-center gap-3 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white">
            <PinIcon />
            Map
          </span>
          <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-emerald-100/50">
            <ListIcon />
            Reports
            <span className="ml-auto rounded-full bg-emerald-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
              soon
            </span>
          </span>
          <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-emerald-100/50">
            <LayersIcon />
            Zones
            <span className="ml-auto rounded-full bg-emerald-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
              soon
            </span>
          </span>
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

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[60px] shrink-0 items-center border-b border-gray-200 bg-white px-6">
          <div>
            <div className="text-[15px] font-semibold text-gray-900">Live Map</div>
            <div className="text-xs text-gray-500">
              Reported infrastructure issues across the city
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Connected
          </div>
        </header>
        <div className="relative flex-1">
          <MapView />
        </div>
      </main>
    </div>
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

function LayersIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
