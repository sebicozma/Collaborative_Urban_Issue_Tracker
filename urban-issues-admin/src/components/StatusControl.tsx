"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateReportStatus } from "@/app/reports/actions";
import type { ReportStatus } from "@/lib/reports";

const TRANSITIONS: { status: ReportStatus; label: string; cls: string }[] = [
  { status: "in_review", label: "Mark In Review", cls: "bg-amber-600 hover:bg-amber-700" },
  { status: "approved", label: "Approve", cls: "bg-emerald-600 hover:bg-emerald-700" },
  { status: "rejected", label: "Reject", cls: "bg-red-600 hover:bg-red-700" },
];

export default function StatusControl({
  reportId,
  currentStatus,
}: {
  reportId: string;
  currentStatus: string;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(status: ReportStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateReportStatus(reportId, status, reason);
      if (!result.ok) {
        setError(result.error);
      } else {
        setReason("");
        router.refresh();
      }
    });
  }

  return (
    <div>
      <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-gray-700">
        Reason / note <span className="font-normal text-gray-400">(optional)</span>
      </label>
      <textarea
        id="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Why is the status changing? Shown to the reporter."
        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />
      <div className="mt-1 text-right text-[11px] text-gray-400">{reason.length}/500</div>

      <div className="mt-2 flex flex-col gap-2">
        {TRANSITIONS.map((t) => {
          const isCurrent = currentStatus === t.status;
          return (
            <button
              key={t.status}
              type="button"
              disabled={pending || isCurrent}
              onClick={() => submit(t.status)}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${t.cls}`}
            >
              {isCurrent ? `${t.label} (current)` : t.label}
            </button>
          );
        })}
      </div>

      {pending && <p className="mt-3 text-sm text-gray-500">Updating…</p>}
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
