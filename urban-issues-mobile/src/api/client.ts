import { API_CONFIG } from './config';
import { ProblemDetails } from '../types/api';

// Thrown when the server returns a non-2xx status
export class ApiError extends Error {
  constructor(
    public status: number,
    public problem: ProblemDetails,
  ) {
    super(problem.title);
  }
}

// Generic fetch wrapper — attaches bearer token and deserialises JSON
export async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_CONFIG.baseUrl}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const problem: ProblemDetails = await response.json().catch(() => ({
      type: 'about:blank',
      title: 'Request failed',
      status: response.status,
    }));
    throw new ApiError(response.status, problem);
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}
