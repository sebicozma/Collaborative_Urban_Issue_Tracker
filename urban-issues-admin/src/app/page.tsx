import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { fetchReports } from "@/lib/reports";
import Sidebar from "@/components/Sidebar";
import MapView from "@/components/MapView";

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

  const reports = await fetchReports();
  const connected = reports !== null;

  return (
    <div className="flex h-screen w-full">
      <Sidebar active="map" user={user} />

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
            <span
              className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`}
            />
            {connected ? "Connected" : "Reports API unreachable"}
          </div>
        </header>
        <div className="relative flex-1">
          <MapView reports={reports ?? []} />
        </div>
      </main>
    </div>
  );
}
