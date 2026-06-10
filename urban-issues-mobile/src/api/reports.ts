import { request, TokenGetter } from './http';
import {
  CreateReportRequest,
  CreateReportResponse,
  ReportDetail,
  ReportListResponse,
  ReportStatus,
} from './types';

export type ListReportsParams = {
  status?: ReportStatus;
  limit?: number;
  cursor?: string;
};

/** GET /reports — cursor-paginated, newest first, optionally filtered by status. */
export function listReports(
  getToken: TokenGetter,
  params: ListReportsParams = {},
): Promise<ReportListResponse> {
  return request<ReportListResponse>('/reports', {
    getToken,
    query: { status: params.status, limit: params.limit, cursor: params.cursor },
  });
}

/** GET /reports/{id} — full report detail. */
export function getReport(getToken: TokenGetter, reportId: string): Promise<ReportDetail> {
  return request<ReportDetail>(`/reports/${reportId}`, { getToken });
}

/** POST /reports — submit a new report (reporter taken from the JWT subject). */
export function createReport(
  getToken: TokenGetter,
  body: CreateReportRequest,
): Promise<CreateReportResponse> {
  return request<CreateReportResponse>('/reports', { getToken, method: 'POST', body });
}
