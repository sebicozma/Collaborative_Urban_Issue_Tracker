import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/auth/auth-context';

import { createReport, getReport, listReports } from './reports';
import { CreateReportRequest, ReportStatus } from './types';

export const reportKeys = {
  all: ['reports'] as const,
  list: (status?: ReportStatus) => ['reports', 'list', status ?? 'all'] as const,
  detail: (id: string) => ['reports', 'detail', id] as const,
};

/** Infinite, cursor-paginated community feed, optionally filtered by status. */
export function useReportsFeed(status?: ReportStatus) {
  const { getAccessToken } = useAuth();
  return useInfiniteQuery({
    queryKey: reportKeys.list(status),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => listReports(getAccessToken, { status, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** A single report. Polls while the report is still awaiting AI classification. */
export function useReport(reportId: string) {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: reportKeys.detail(reportId),
    queryFn: () => getReport(getAccessToken, reportId),
    enabled: !!reportId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && !data.classifiedCategory && data.status === 'submitted') return 5_000;
      return false;
    },
  });
}

/** Submit a new report; invalidates the feed so it shows up on success. */
export function useCreateReport() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReportRequest) => createReport(getAccessToken, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}
