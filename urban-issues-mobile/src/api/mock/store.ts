// In-memory mock database backed by AsyncStorage for persistence between sessions
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReportDetail, UserRole } from '../../types/api';

// Simple UUID v4 generator (no external library needed)
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export interface MockUser {
  userId: string;
  email: string;
  password: string; // stored plain-text — this is only for mock/dev use
  fullName: string;
  role: UserRole;
  createdAt: string;
}

const USERS_KEY = '@mock:users';
const REPORTS_KEY = '@mock:reports';

export async function getUsers(): Promise<MockUser[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveUsers(users: MockUser[]): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function getReports(): Promise<ReportDetail[]> {
  const raw = await AsyncStorage.getItem(REPORTS_KEY);
  if (raw) return JSON.parse(raw);

  // Seed sample data on first launch so the list is not empty
  const seed = buildSeedReports();
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(seed));
  return seed;
}

export async function saveReports(reports: ReportDetail[]): Promise<void> {
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

// Extract userId from the mock token format: "mock_token_<userId>"
export function getUserIdFromToken(token: string): string | null {
  if (!token.startsWith('mock_token_')) return null;
  return token.slice('mock_token_'.length);
}

function buildSeedReports(): ReportDetail[] {
  const ago = (days: number) => new Date(Date.now() - 86_400_000 * days).toISOString();
  return [
    {
      reportId: generateId(),
      title: 'Large pothole on Main Street',
      description:
        'There is a large pothole near the intersection with Oak Avenue that is already damaging vehicles. Needs urgent repair.',
      category: 'road',
      status: 'in_review',
      location: { lat: 45.7489, lon: 21.2087 },
      reporterUserId: 'seed',
      classifiedCategory: 'road',
      statusReason: null,
      createdAt: ago(3),
      updatedAt: ago(1),
    },
    {
      reportId: generateId(),
      title: 'Broken street light on Park Blvd',
      description:
        'The street light at the corner of Park Boulevard has been out for a week. The area is very dark at night and feels unsafe.',
      category: 'lighting',
      status: 'submitted',
      location: { lat: 45.7512, lon: 21.2201 },
      reporterUserId: 'seed',
      classifiedCategory: null,
      statusReason: null,
      createdAt: ago(1),
    },
    {
      reportId: generateId(),
      title: 'Overflowing rubbish bins near central park',
      description:
        'The rubbish bins at the central park entrance have been overflowing for several days and are attracting pests.',
      category: 'waste',
      status: 'approved',
      location: { lat: 45.7534, lon: 21.2156 },
      reporterUserId: 'seed',
      classifiedCategory: 'waste',
      statusReason: 'Cleanup scheduled for Friday.',
      createdAt: ago(6),
      updatedAt: ago(4),
    },
    {
      reportId: generateId(),
      title: 'Graffiti on pedestrian underpass',
      description: 'Heavy graffiti covering both walls of the underpass near the train station.',
      category: 'safety',
      status: 'rejected',
      location: { lat: 45.7455, lon: 21.2310 },
      reporterUserId: 'seed',
      classifiedCategory: 'safety',
      statusReason: 'Outside city jurisdiction — please contact the railway authority.',
      createdAt: ago(10),
      updatedAt: ago(8),
    },
  ];
}
