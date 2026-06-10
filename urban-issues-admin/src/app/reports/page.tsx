import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { fetchReports } from "@/lib/reports";
import Sidebar from "@/components/Sidebar";
import { CategoryBadge, StatusBadge } from "@/components/badges";

const FILTERS: { label: string; value?: string }[] = [
  { label: "All" },
  { label: "Submitted", value: "submitted" },
  { label: "In Review", value: "in_review" },
  { label: "Classified", value: "classified" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session.user) {
    redirect("/login");
  }

  const { status } = await searchParams;
  const reports = await fetchReports(status);
  const connected = reports !== null;
  const items = reports ?? [];

  return (
    <div className="flex h-screen w-full">
      <Sidebar active="reports" user={session.user} />

      <main className="flex min-w-0 flex-1 flex-col bg-gray-50">
        <header className="flex h-[60px] shrink-0 items-center border-b border-gray-200 bg-white px-6">
          <div>
            <div className="text-[15px] font-semibold text-gray-900">Reports</div>
            <div className="text-xs text-gray-500">
              Review and triage reported infrastructure issues
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <span
              className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`}
            />
            {connected ? `${items.length} report${items.length === 1 ? "" : "s"}` : "Reports API unreachable"}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          {/* Status filter pills */}
          <div className="mb-4 flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = status === f.value || (!status && !f.value);
              const href = f.value ? `/reports?status=${f.value}` : "/reports";
              return (
                <Link
                  key={f.label}
                  href={href}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>

          {!connected ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
              Could not reach the reports service. Check that it is running and that your session is valid.
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <div className="text-3xl">📭</div>
              <div className="mt-2 text-sm font-semibold text-gray-900">No reports</div>
              <div className="mt-1 text-sm text-gray-500">
                Nothing matches this filter yet.
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Reported</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((r) => (
                    <tr key={r.reportId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/reports/${r.reportId}`}
                          className="font-medium text-gray-900 hover:text-emerald-700"
                        >
                          {r.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <CategoryBadge category={r.category} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/reports/${r.reportId}`}
                          className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
