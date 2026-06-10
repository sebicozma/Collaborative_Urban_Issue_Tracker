import { getSession } from "./session";

/**
 * Server-side client for the reports service. Runs only in Server Components /
 * Route Handlers, where the session's access token is available.
 */

export interface ReportSummary {
  reportId: string;
  title: string;
  category: string | null;
  status: string;
  createdAt: string;
  location: { lat: number; lon: number };
}

const REPORTS_API_URL = process.env.REPORTS_API_URL ?? "http://localhost:8081";

/** Returns the latest reports, or null when the API is unreachable/rejects us. */
export async function fetchReports(): Promise<ReportSummary[] | null> {
  const session = await getSession();
  if (!session.accessToken) return null;

  try {
    const res = await fetch(`${REPORTS_API_URL}/reports?limit=100`, {
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
