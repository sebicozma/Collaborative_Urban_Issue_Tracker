// TypeScript types mirroring the Reports API contract (ReportsService DTOs).
// JSON is camelCase; dates are ISO-8601 strings.

export type ReportStatus =
  | 'submitted'
  | 'in_review'
  | 'classified'
  | 'approved'
  | 'rejected';

export type ReportCategory = 'waste' | 'road' | 'lighting' | 'water' | 'safety' | 'other';

export interface GeoPoint {
  lat: number;
  lon: number;
}

/** Item shape returned by GET /reports (now includes location). */
export interface ReportSummary {
  reportId: string;
  title: string;
  category: string;
  status: ReportStatus;
  createdAt: string;
  location: GeoPoint;
}

/** Full report returned by GET /reports/{id}. */
export interface ReportDetail {
  reportId: string;
  title: string;
  category: string;
  status: ReportStatus;
  createdAt: string;
  description: string;
  location: GeoPoint;
  reporterUserId: string;
  /** Set asynchronously by the AI classification consumer; null until then. */
  classifiedCategory: string | null;
  /** Reason attached when a report's status is changed (set via the admin side). */
  statusReason: string | null;
  updatedAt: string | null;
}

export interface ReportListResponse {
  items: ReportSummary[];
  /** Opaque base64 keyset cursor; null when there are no more pages. */
  nextCursor: string | null;
}

export interface CreateReportRequest {
  title: string;
  description: string;
  category: ReportCategory;
  location: GeoPoint;
  /** URIs, max 10 (no upload endpoint yet — omitted by the app for now). */
  attachments?: string[];
}

export interface CreateReportResponse {
  reportId: string;
  status: ReportStatus;
  createdAt: string;
}

/** RFC 7807 error body returned by the gateway / reports-service. */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}
