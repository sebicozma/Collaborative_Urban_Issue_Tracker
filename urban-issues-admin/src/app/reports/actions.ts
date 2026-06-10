"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/session";
import { REPORTS_API_URL, type ReportStatus } from "@/lib/reports";

export type UpdateStatusResult = { ok: true } | { ok: false; error: string };

/**
 * Server Action: change a report's status (and optional reason) via the reports
 * service. The access token never leaves the server. On success the reports list
 * and this report's detail page are revalidated.
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  reason: string,
): Promise<UpdateStatusResult> {
  const session = await getSession();
  if (!session.accessToken) {
    return { ok: false, error: "Your session has expired — please sign in again." };
  }

  try {
    const res = await fetch(`${REPORTS_API_URL}/reports/${reportId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, reason: reason.trim() || undefined }),
    });

    if (!res.ok) {
      let detail = `Request failed (${res.status}).`;
      try {
        const problem = await res.json();
        detail = problem?.detail || problem?.title || detail;
      } catch {
        /* keep default */
      }
      return { ok: false, error: detail };
    }

    revalidatePath(`/reports/${reportId}`);
    revalidatePath("/reports");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the reports service." };
  }
}
