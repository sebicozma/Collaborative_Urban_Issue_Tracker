import { API_CONFIG } from './config';
import { ProblemDetails } from './types';

/** Thrown when the Reports API returns a non-2xx status. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public problem: ProblemDetails,
  ) {
    super(problem.detail || problem.title);
    this.name = 'ApiError';
  }
}

/** Supplies a valid bearer token, refreshing on demand. Matches `useAuth().getAccessToken`. */
export type TokenGetter = (opts?: { force?: boolean }) => Promise<string | null>;

type RequestOptions = {
  getToken: TokenGetter;
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
};

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_CONFIG.baseUrl}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function toApiError(res: Response): Promise<ApiError> {
  const problem = (await res.json().catch(() => null)) as ProblemDetails | null;
  return new ApiError(
    res.status,
    problem ?? { type: 'about:blank', title: 'Request failed', status: res.status },
  );
}

/**
 * Fetch wrapper for the Reports API. Attaches a fresh bearer token, serialises
 * JSON, and maps error bodies to {@link ApiError}. On a 401 it forces a single
 * token refresh and retries once (covers an access token expiring mid-session).
 */
export async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const { getToken, method = 'GET', body, query } = options;
  const url = buildUrl(path, query);

  const send = (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await send(await getToken());

  if (res.status === 401) {
    const refreshed = await getToken({ force: true });
    if (refreshed) res = await send(refreshed);
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
