// TypeScript types that mirror the OpenAPI 3.1 gateway contract exactly

export type UserRole = 'citizen' | 'contractor' | 'admin' | 'supervisor';

export type ReportStatus = 'submitted' | 'in_review' | 'classified' | 'approved' | 'rejected';

export type ReportCategory = 'waste' | 'road' | 'lighting' | 'water' | 'safety' | 'other';

export interface GeoPoint {
  lat: number;
  lon: number;
}

// --- Auth ---

export interface UserRegistrationRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface UserRegistrationResponse {
  userId: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface TokenRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // seconds
}

// --- Reports ---

export interface ReportCreateRequest {
  title: string;
  description: string;
  category: ReportCategory;
  location: GeoPoint;
  attachments?: string[]; // URIs, max 10
}

export interface ReportCreateResponse {
  reportId: string;
  status: ReportStatus;
  createdAt: string;
}

export interface ReportSummary {
  reportId: string;
  title: string;
  category: string;
  status: ReportStatus;
  createdAt: string;
}

export interface ReportDetail extends ReportSummary {
  description: string;
  location: GeoPoint;
  reporterUserId: string;
  classifiedCategory: string | null;
  statusReason: string | null;
  updatedAt?: string;
}

export interface ReportListResponse {
  items: ReportSummary[];
  nextCursor: string | null;
}

export interface ReportStatusUpdateRequest {
  status: ReportStatus;
  reason?: string;
}

export interface ReportStatusUpdateResponse {
  reportId: string;
  previousStatus: ReportStatus;
  currentStatus: ReportStatus;
  updatedAt: string;
}

// Error shape from the gateway (RFC 7807 Problem Details)
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
}

// Local session — not part of the API contract, stored in AsyncStorage
export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  accessToken: string;
}
