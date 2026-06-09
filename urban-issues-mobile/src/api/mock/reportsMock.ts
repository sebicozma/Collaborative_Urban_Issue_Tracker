import {
  ReportCreateRequest,
  ReportCreateResponse,
  ReportDetail,
  ReportListResponse,
  ReportStatus,
  ReportStatusUpdateRequest,
  ReportStatusUpdateResponse,
} from '../../types/api';
import { ApiError } from '../client';
import { generateId, getReports, getUserIdFromToken, saveReports } from './store';

const PAGE_SIZE = 20;

export async function mockListReports(
  token: string,
  status?: ReportStatus,
  cursor?: string,
): Promise<ReportListResponse> {
  const userId = getUserIdFromToken(token);
  if (!userId) throw new ApiError(401, { type: 'unauthorized', title: 'Unauthorized', status: 401 });

  const all = await getReports();

  // Sort newest first, then apply optional status filter
  let filtered = [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (status) filtered = filtered.filter((r) => r.status === status);

  // Cursor is a numeric offset string for simplicity
  const offset = cursor ? parseInt(cursor, 10) : 0;
  const page = filtered.slice(offset, offset + PAGE_SIZE);
  const nextCursor = offset + PAGE_SIZE < filtered.length ? String(offset + PAGE_SIZE) : null;

  return {
    items: page.map(({ reportId, title, category, status: s, createdAt }) => ({
      reportId, title, category, status: s, createdAt,
    })),
    nextCursor,
  };
}

export async function mockCreateReport(token: string, data: ReportCreateRequest): Promise<ReportCreateResponse> {
  const userId = getUserIdFromToken(token);
  if (!userId) throw new ApiError(401, { type: 'unauthorized', title: 'Unauthorized', status: 401 });

  const reports = await getReports();
  const now = new Date().toISOString();

  const newReport: ReportDetail = {
    reportId: generateId(),
    title: data.title,
    description: data.description,
    category: data.category,
    status: 'submitted',
    location: data.location,
    reporterUserId: userId,
    classifiedCategory: null,
    statusReason: null,
    createdAt: now,
  };

  await saveReports([...reports, newReport]);

  return { reportId: newReport.reportId, status: 'submitted', createdAt: now };
}

export async function mockGetReport(token: string, reportId: string): Promise<ReportDetail> {
  const userId = getUserIdFromToken(token);
  if (!userId) throw new ApiError(401, { type: 'unauthorized', title: 'Unauthorized', status: 401 });

  const reports = await getReports();
  const report = reports.find((r) => r.reportId === reportId);

  if (!report) throw new ApiError(404, { type: 'not-found', title: 'Report not found', status: 404 });

  return report;
}

export async function mockUpdateStatus(
  token: string,
  reportId: string,
  data: ReportStatusUpdateRequest,
): Promise<ReportStatusUpdateResponse> {
  const userId = getUserIdFromToken(token);
  if (!userId) throw new ApiError(401, { type: 'unauthorized', title: 'Unauthorized', status: 401 });

  const reports = await getReports();
  const index = reports.findIndex((r) => r.reportId === reportId);

  if (index === -1) throw new ApiError(404, { type: 'not-found', title: 'Report not found', status: 404 });

  const previous = reports[index].status;
  const now = new Date().toISOString();

  reports[index] = { ...reports[index], status: data.status, statusReason: data.reason ?? null, updatedAt: now };
  await saveReports(reports);

  return { reportId, previousStatus: previous, currentStatus: data.status, updatedAt: now };
}
