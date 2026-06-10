import { getSession } from "./session";

/**
 * Server-side client for the reports service. Runs only in Server Components /
 * Route Handlers / Server Actions, where the session's access token is available.
 */

export type ReportStatus =
  | "submitted"
  | "in_review"
  | "classified"
  | "approved"
  | "rejected";

export interface ReportSummary {
  reportId: string;
  title: string;
  category: string | null;
  status: string;
  createdAt: string;
  location: { lat: number; lon: number };
}

export interface ReportDetail extends ReportSummary {
  description: string;
  reporterUserId: string;
  /** Set asynchronously by the AI classification service; null until then. */
  classifiedCategory: string | null;
  /** Reason recorded with the last status change. */
  statusReason: string | null;
  updatedAt: string | null;
}

export const REPORTS_API_URL = process.env.REPORTS_API_URL ?? "http://localhost:8081";

/**
 * Returns the latest reports (optionally filtered by status), or null when the
 * API is unreachable / rejects us.
 */
export async function fetchReports(status?: string): Promise<ReportSummary[] | null> {
  const session = await getSession();
  if (!session.accessToken) return null;

  const params = new URLSearchParams({ limit: "100" });
  if (status) params.set("status", status);

  try {
    const res = await fetch(`${REPORTS_API_URL}/reports?${params}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body: { items: ReportSummary[] } = await res.json();
    return body.items;
  } catch {
    return null;
  }
}

/** Returns a single report's full detail, or null when not found / unreachable. */
export async function fetchReport(reportId: string): Promise<ReportDetail | null> {
  const session = await getSession();
  if (!session.accessToken) return null;

  try {
    const res = await fetch(`${REPORTS_API_URL}/reports/${reportId}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as ReportDetail;
  } catch {
    return null;
  }
}
