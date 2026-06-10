// API configuration loaded from environment variables.
// Set EXPO_PUBLIC_USE_MOCK=true in .env to use local mock data instead.
export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  useMock: process.env.EXPO_PUBLIC_USE_MOCK === 'true',
};
