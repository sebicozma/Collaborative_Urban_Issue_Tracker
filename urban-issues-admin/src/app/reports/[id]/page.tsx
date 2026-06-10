import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { fetchReport } from "@/lib/reports";
import Sidebar from "@/components/Sidebar";
import { CategoryBadge, StatusBadge } from "@/components/badges";
import StatusControl from "@/components/StatusControl";

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session.user) {
    redirect("/login");
  }

  const { id } = await params;
  const report = await fetchReport(id);

  return (
    <div className="flex h-screen w-full">
      <Sidebar active="reports" user={session.user} />

      <main className="flex min-w-0 flex-1 flex-col bg-gray-50">
        <header className="flex h-[60px] shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6">
          <Link
            href="/reports"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            ← Reports
          </Link>
          <div className="truncate text-[15px] font-semibold text-gray-900">
            {report?.title ?? "Report"}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          {!report ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
              Report not found, or the reports service is unreachable.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main detail */}
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-xl font-bold text-gray-900">{report.title}</h1>
                    <StatusBadge status={report.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <CategoryBadge category={report.category} />
                    {report.classifiedCategory && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20">
                        🤖 AI: {report.classifiedCategory}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Description
                  </h2>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {report.description}
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
                    <Meta label="Reported">
                      {formatDateTime(report.createdAt)}
                    </Meta>
                    <Meta label="Last updated">
                      {formatDateTime(report.updatedAt) ?? "—"}
                    </Meta>
                    <Meta label="Reporter">
                      <span className="font-mono text-xs">
                        {report.reporterUserId.slice(0, 8)}…
                      </span>
                    </Meta>
                    <Meta label="Location">
                      <a
                        href={`https://maps.google.com/?q=${report.location.lat},${report.location.lon}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:text-emerald-800"
                      >
                        {report.location.lat.toFixed(5)}, {report.location.lon.toFixed(5)} ↗
                      </a>
                    </Meta>
                  </div>
                </div>

                {report.statusReason && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                      Current status note
                    </div>
                    <p className="mt-1 text-sm text-amber-900">{report.statusReason}</p>
                  </div>
                )}
              </div>

              {/* Status management */}
              <div className="lg:col-span-1">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h2 className="text-sm font-semibold text-gray-900">Update status</h2>
                  <p className="mt-1 mb-4 text-xs text-gray-500">
                    Current: <StatusBadge status={report.status} />
                  </p>
                  <StatusControl reportId={report.reportId} currentStatus={report.status} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-400">{label}</div>
      <div className="mt-0.5 text-gray-700">{children}</div>
    </div>
  );
}
