// API configuration loaded from environment variables.
// Set EXPO_PUBLIC_USE_MOCK=false in .env to hit the real gateway.
export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.urbanpulse.example.com/v1',
  useMock: process.env.EXPO_PUBLIC_USE_MOCK !== 'false',
};
