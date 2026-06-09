import {
  ReportCreateRequest,
  ReportCreateResponse,
  ReportDetail,
  ReportListResponse,
  ReportStatus,
  ReportStatusUpdateRequest,
  ReportStatusUpdateResponse,
} from '../types/api';
import { API_CONFIG } from './config';
import { request } from './client';
import { mockCreateReport, mockGetReport, mockListReports, mockUpdateStatus } from './mock';

export async function listReports(
  token: string,
  status?: ReportStatus,
  cursor?: string,
): Promise<ReportListResponse> {
  if (API_CONFIG.useMock) return mockListReports(token, status, cursor);

  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (cursor) params.set('cursor', cursor);
  const qs = params.toString() ? `?${params}` : '';

  return request<ReportListResponse>(`/reports${qs}`, { token });
}

export async function createReport(token: string, data: ReportCreateRequest): Promise<ReportCreateResponse> {
  if (API_CONFIG.useMock) return mockCreateReport(token, data);
  return request<ReportCreateResponse>('/reports', { method: 'POST', token, body: JSON.stringify(data) });
}

export async function getReport(token: string, reportId: string): Promise<ReportDetail> {
  if (API_CONFIG.useMock) return mockGetReport(token, reportId);
  return request<ReportDetail>(`/reports/${reportId}`, { token });
}

export async function updateReportStatus(
  token: string,
  reportId: string,
  data: ReportStatusUpdateRequest,
): Promise<ReportStatusUpdateResponse> {
  if (API_CONFIG.useMock) return mockUpdateStatus(token, reportId, data);
  return request<ReportStatusUpdateResponse>(`/reports/${reportId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  });
}
